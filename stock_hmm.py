"""Train a Gaussian Hidden Markov Model on historical stock prices.

This script downloads price history for the top 20 S&P 500 companies and
trains a Gaussian HMM on log returns for each ticker.  The model's expected
next-day return is printed as a simple directional indicator.

Example usage:
    python stock_hmm.py --start 2018-01-01
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from typing import Iterable, List

import numpy as np
import yfinance as yf
from hmmlearn.hmm import GaussianHMM

# Top 20 S&P 500 constituents by market cap (approximate)
TOP_20_TICKERS: List[str] = [
    "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "META", "TSLA", "BRK-B",
    "UNH", "JPM", "V", "JNJ", "XOM", "PG", "LLY", "MA", "AVGO",
    "HD", "MRK", "PEP",
]


@dataclass
class StockModelResult:
    ticker: str
    expected_return: float


def fetch_log_returns(ticker: str, start: str = "2018-01-01") -> np.ndarray:
    """Download historical data and compute log returns."""
    data = yf.download(ticker, start=start, progress=False)
    returns = np.log(data["Adj Close"]).diff().dropna().to_numpy().reshape(-1, 1)
    return returns


def train_hmm(returns: np.ndarray, states: int = 2) -> GaussianHMM:
    """Fit a Gaussian HMM to the return series."""
    model = GaussianHMM(n_components=states, covariance_type="diag", n_iter=100)
    model.fit(returns)
    return model


def predict_next_return(model: GaussianHMM, last_return: float) -> float:
    """Estimate the expected next-day return given the last observed return."""
    logprob, state_sequence = model.decode(np.array([[last_return]]), algorithm="viterbi")
    last_state = state_sequence[-1]
    transition_probs = model.transmat_[last_state]
    means = model.means_.flatten()
    expected = float(np.dot(transition_probs, means))
    return expected


def run_models(tickers: Iterable[str], start: str) -> List[StockModelResult]:
    results: List[StockModelResult] = []
    for ticker in tickers:
        returns = fetch_log_returns(ticker, start=start)
        model = train_hmm(returns)
        exp_return = predict_next_return(model, returns[-1][0])
        results.append(StockModelResult(ticker, exp_return))
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="HMM stock movement predictor")
    parser.add_argument("--tickers", nargs="*", default=TOP_20_TICKERS,
                        help="Ticker symbols to analyze")
    parser.add_argument("--start", default="2018-01-01",
                        help="Start date for historical prices")
    args = parser.parse_args()

    results = run_models(args.tickers, start=args.start)
    for res in results:
        direction = "up" if res.expected_return > 0 else "down"
        print(f"{res.ticker}: expected next-day move {direction} ({res.expected_return:.6f})")


if __name__ == "__main__":
    main()
