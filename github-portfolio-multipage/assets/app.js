// Shared nav + dynamic GitHub repo loader
(function(){
  const btn = document.getElementById('menuBtn');
  const drawer = document.getElementById('mobileMenu');
  btn?.addEventListener('click', () => {
    const open = drawer.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  drawer?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    drawer.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  }));

  // Fill current year
  const yearEl = document.getElementById('year');
  if(yearEl){ yearEl.textContent = new Date().getFullYear(); }

  // Auto-sync projects with GitHub (client-side)
  // Configure your username via <meta name="gh-username" content="your-github">
  const meta = document.querySelector('meta[name="gh-username"]');
  const username = meta?.content?.trim();
  const grid = document.getElementById('projectGrid');

  async function fetchRepos(user){
    const resp = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`);
    if(!resp.ok) throw new Error('GitHub API error');
    return await resp.json();
  }

  async function fetchPins(){
    try{
      const r = await fetch('/pins.json', {cache:'no-store'});
      if(r.ok){ return await r.json(); }
    }catch(e){}
    return [];
  }

  function prioritizeRepos(repos, pins){
    const byName = new Map(repos.map(r=>[r.name.toLowerCase(), r]));
    const chosen = [];

    // 1) add pinned in order if exist
    pins.forEach(name => {
      const r = byName.get(String(name).toLowerCase());
      if(r) chosen.push(r);
    });

    // 2) add remaining, sorted by stargazers then recent update
    const rest = repos
      .filter(r => !chosen.includes(r) && !r.fork && !r.archived)
      .sort((a,b)=> (b.stargazers_count - a.stargazers_count) || (new Date(b.pushed_at) - new Date(a.pushed_at)));

    return chosen.concat(rest);
  }

  function createCard(repo){
    const card = document.createElement('article');
    card.className = 'card project';

    const title = document.createElement('h3');
    title.textContent = repo.name;

    const desc = document.createElement('p');
    desc.className = 'muted';
    desc.textContent = repo.description || 'No description provided.';

    const chips = document.createElement('div');
    chips.className = 'chips';
    // Try to surface top languages and stars
    if(repo.language){
      const c = document.createElement('span'); c.className='chip'; c.textContent = repo.language; chips.appendChild(c);
    }
    const s = document.createElement('span'); s.className='chip'; s.textContent = `★ ${repo.stargazers_count}`; chips.appendChild(s);
    const u = document.createElement('span'); u.className='chip'; u.textContent = new Date(repo.pushed_at).toISOString().slice(0,10); chips.appendChild(u);

    const links = document.createElement('div');
    links.className = 'links';
    const repoA = document.createElement('a'); repoA.href = repo.html_url; repoA.target = '_blank'; repoA.rel = 'noopener'; repoA.className = 'btn'; repoA.textContent = 'Repo'; links.appendChild(repoA);
    if(repo.homepage){ const demo = document.createElement('a'); demo.href = repo.homepage; demo.target='_blank'; demo.rel='noopener'; demo.className='btn'; demo.textContent='Demo'; links.appendChild(demo); }

    card.append(title, desc, chips, links);
    return card;
  }

  async function init(){
    if(!grid || !username) return;
    try{
      const [repos, pins] = await Promise.all([fetchRepos(username), fetchPins()]);
      const ordered = prioritizeRepos(repos, pins);
      const frag = document.createDocumentFragment();
      ordered.slice(0, 12).forEach(r => frag.appendChild(createCard(r)));
      grid.textContent = '';
      grid.appendChild(frag);
    }catch(err){
      grid.innerHTML = '<p class="muted">Unable to load projects from GitHub right now.</p>';
      console.error(err);
    }
  }

  init();
})();