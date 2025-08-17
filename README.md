# pythonerik.github.io
Personal Website

## Stock HMM predictor

`stock_hmm.py` downloads historical prices for the top 20 S&P 500 stocks
and trains a Gaussian Hidden Markov Model on the log returns for each
ticker.  The script prints the expected next-day return as a simple
directional indicator.

### Requirements

The script depends on `numpy`, `pandas`, `yfinance`, `hmmlearn`, and
`scikit-learn`.

### Usage

```bash
python stock_hmm.py --start 2018-01-01
```

Optional `--tickers` arguments can be provided to override the default
top 20 list.
