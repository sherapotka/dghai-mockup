/* =====================================================================
   Global Health & AI Lab: interactive behaviour
   Renders team, projects and publications from data.js / publications.js.
   ===================================================================== */

(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TEAM = window.TEAM || [];
  const PUBS = window.PUBLICATIONS || [];
  const byId = Object.fromEntries(TEAM.map(p => [p.id, p]));
  const initials = name => name.replace(/[“”"()]/g, '').split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('');
  const avatar = (p, size = 30) => p.photo
    ? `<span class="av" style="width:${size}px;height:${size}px"><img src="${p.photo}" alt="" loading="lazy"></span>`
    : `<span class="av" style="width:${size}px;height:${size}px;font-size:${Math.round(size / 2.6)}px">${initials(p.name)}</span>`;

  // -------------------------------------------------------------------
  // Scrollspy: tab strip + sidebar "On this page"
  // -------------------------------------------------------------------
  const tabLinks = $$('.tab-link');
  const sideLinks = $$('.side-links a');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = '#' + e.target.id;
      const tab = e.target.dataset.tab ? '#' + e.target.dataset.tab : id;
      tabLinks.forEach(a => a.classList.toggle('active', a.hash === tab));
      sideLinks.forEach(a => a.classList.toggle('active', a.hash === id));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  $$('.block[id]').forEach(s => spy.observe(s));

  // -------------------------------------------------------------------
  // Reveal on scroll
  // -------------------------------------------------------------------
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -60px 0px' });
  const observeReveal = el => revealObs.observe(el);
  $$('.reveal').forEach(observeReveal);

  // -------------------------------------------------------------------
  // Stat counters
  // -------------------------------------------------------------------
  $$('[data-pubcount]').forEach(el => el.dataset.count = PUBS.length || el.dataset.count);
  $$('[data-teamcount]').forEach(el => el.dataset.count = TEAM.length || el.dataset.count);
  $$('[data-trialcount]').forEach(el => el.dataset.count = PUBS.filter(p => /randomized|rct/i.test(p.type)).length || el.dataset.count);
  $$('[data-pubtotal]').forEach(el => el.textContent = PUBS.length);
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countObs.unobserve(e.target);
      const end = +e.target.dataset.count, t0 = performance.now(), dur = reduced ? 0 : 1400;
      const step = now => {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1;
        e.target.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
  $$('[data-count]').forEach(el => countObs.observe(el));

  // -------------------------------------------------------------------
  // Timeline
  // -------------------------------------------------------------------
  const tl = $('#timeline');
  if (tl) {
    tl.innerHTML = (window.MILESTONES || []).map(m => `<li><div class="tl-year">${m.year}</div><div class="tl-title">${esc(m.title)}</div><p>${esc(m.text)}</p></li>`).join('');
    $$('[data-tl]').forEach(b => b.addEventListener('click', () => tl.scrollBy({ left: +b.dataset.tl * 280, behavior: 'smooth' })));
  }

  // -------------------------------------------------------------------
  // Modal
  // -------------------------------------------------------------------
  const modal = $('#modal'), modalBody = $('#modal-body');
  let lastFocus = null;
  const openModal = html => {
    lastFocus = document.activeElement;
    modalBody.innerHTML = html;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal-close', modal).focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  modal.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeModal();
    const person = e.target.closest('[data-person]');
    if (person) openPerson(person.dataset.person);
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  $$('.open-person').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openPerson(b.dataset.person); }));

  const projectsFor = id => (window.PROJECTS || []).filter(p => p.people.includes(id));

  function openPerson(id) {
    const p = byId[id]; if (!p) return;
    const links = Object.entries(p.links || {}).map(([k, v]) => `<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k)} ↗</a>`).join('');
    const labProjects = projectsFor(id).map(x => x.title);
    const projects = p.projects && p.projects.length ? p.projects : labProjects;
    openModal(`
      <div class="profile">
        <aside class="profile-side">
          ${p.photo ? `<span class="av"><img src="${p.photo}" alt="Portrait of ${esc(p.name)}"></span>` : `<span class="av">${initials(p.name)}</span>`}
          ${links ? `<div class="profile-links">${links}</div>` : ''}
        </aside>
        <div class="profile-main">
          <h2 id="modal-title">${esc(p.name)}${p.creds ? `<span class="member-creds">, ${esc(p.creds)}</span>` : ''}</h2>
          <div class="profile-role">${esc(p.role)}${p.since ? ` · ${esc(p.since)}` : ''}</div>
          <div class="profile-aff">${esc(p.affiliation)}</div>
          ${p.bio.map(b => `<p>${esc(b)}</p>`).join('')}
          ${p.interests && p.interests.length ? `<h4>Research interests</h4><div class="pill-list">${p.interests.map(i => `<span>${esc(i)}</span>`).join('')}</div>` : ''}
          ${projects.length ? `<h4>Current projects</h4><ul class="plain-list">${projects.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
          ${p.education && p.education.length ? `<h4>Education</h4><div class="edu">${p.education.map(([d, s]) => `<div><strong>${esc(d)}</strong><span>${esc(s)}</span></div>`).join('')}</div>` : ''}
          ${p.publications && p.publications.length ? `<h4>Selected publications</h4><ul class="plain-list">${p.publications.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
          ${id === 'richard-lester' ? `<h4>Publications</h4><p><a href="#publications" data-close>Browse all ${PUBS.length} papers on this site →</a></p>` : ''}
        </div>
      </div>`);
  }

  function openProject(i) {
    const p = window.PROJECTS[i];
    const people = p.people.map(id => byId[id]).filter(Boolean);
    openModal(`
      <div class="proj-modal">
        <div class="project-top" style="justify-content:flex-start;gap:14px">
          <span class="status ${p.status === 'active' ? 'status-active' : ''}">${p.status === 'active' ? 'Ongoing' : 'Completed'}</span>
          <span class="project-where">${esc(p.where)}</span>
        </div>
        <h2 id="modal-title">${esc(p.title)}</h2>
        <p class="section-lede">${esc(p.short)}</p>
        <p>${esc(p.long)}</p>
        <div class="pill-list" style="margin:18px 0 26px">${p.themes.map(t => `<span>${esc(t)}</span>`).join('')}</div>
        ${people.length ? `<h4 class="eyebrow" style="color:var(--muted)">People</h4><div class="proj-people">${people.map(m => `<button type="button" class="proj-person" data-person="${m.id}">${avatar(m, 34)}<span>${esc(m.name)}</span></button>`).join('')}</div>` : ''}
      </div>`);
  }

  // -------------------------------------------------------------------
  // Chips helper
  // -------------------------------------------------------------------
  const makeChips = (el, items, onChange, initial) => {
    el.innerHTML = items.map(([v, label, n]) => `<button type="button" class="chip" data-v="${esc(v)}" aria-pressed="${v === initial}">${esc(label)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('');
    el.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', el).forEach(c => c.setAttribute('aria-pressed', c === b));
      onChange(b.dataset.v);
    });
  };

  // -------------------------------------------------------------------
  // Projects
  // -------------------------------------------------------------------
  const pg = $('#project-grid');
  if (pg) {
    const P = window.PROJECTS || [];
    pg.innerHTML = P.map((p, i) => {
      const people = p.people.map(id => byId[id]).filter(Boolean);
      return `<button type="button" class="project reveal" data-i="${i}">
        <div class="project-top"><span class="status ${p.status === 'active' ? 'status-active' : ''}">${p.status === 'active' ? 'Ongoing' : 'Completed'}</span><span class="project-where">${esc(p.where)}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.short)}</p>
        ${people.length ? `<div class="avatars">${people.map(m => avatar(m, 30)).join('')}</div>` : ''}
        <span class="project-more">Details →</span>
      </button>`;
    }).join('');
    $$('.project', pg).forEach(observeReveal);
    pg.addEventListener('click', e => { const c = e.target.closest('.project'); if (c) openProject(+c.dataset.i); });
    const match = (p, f) => f === 'All' || (f === 'Ongoing' && p.status === 'active') || (f === 'Past' && p.status === 'past') || p.themes.includes(f);
    makeChips($('#project-filters'), (window.PROJECT_FILTERS || []).map(f => [f, f, P.filter(p => match(p, f)).length]), f => {
      $$('.project', pg).forEach(c => c.classList.toggle('is-hidden', !match(P[+c.dataset.i], f)));
    }, 'All');
  }

  // Sidebar: current / past project accordions
  const sideProjects = (el, status) => {
    if (!el) return;
    const P = window.PROJECTS || [];
    el.innerHTML = P.map((p, i) => p.status !== status ? '' : `<li><details><summary>${esc(p.title)}</summary>
      <div class="acc-body">${esc(p.short)} <button type="button" class="acc-more" data-project="${i}">Details →</button></div></details></li>`).join('');
    el.addEventListener('click', e => { const b = e.target.closest('[data-project]'); if (b) openProject(+b.dataset.project); });
  };
  sideProjects($('#side-current'), 'active');
  sideProjects($('#side-past'), 'past');

  // -------------------------------------------------------------------
  // Team
  // -------------------------------------------------------------------
  const tg = $('#team-grid');
  if (tg) {
    tg.innerHTML = TEAM.map(p => `
      <button type="button" class="member reveal" data-person="${p.id}" data-group="${p.group}">
        <div class="member-photo">
          ${p.photo ? `<img src="${p.photo}" alt="" loading="lazy">` : `<div class="initials">${initials(p.name)}</div>`}
          <div class="member-hover">${(p.interests || []).slice(0, 3).map(i => `<span>${esc(i.split(':')[0])}</span>`).join('')}</div>
        </div>
        <div class="member-info">
          <div class="member-name">${esc(p.name)}${p.creds ? ` <span class="member-creds">${esc(p.creds)}</span>` : ''}</div>
          <div class="member-role">${esc(p.role)}</div>
        </div>
      </button>`).join('');
    $$('.member', tg).forEach(observeReveal);
    tg.addEventListener('click', e => { const c = e.target.closest('.member'); if (c) openPerson(c.dataset.person); });
    const groups = (window.TEAM_GROUPS || []).map(([v, l]) => [v, l, v === 'all' ? TEAM.length : TEAM.filter(p => p.group === v).length]).filter(g => g[2] > 0);
    makeChips($('#team-filters'), groups, g => {
      $$('.member', tg).forEach(c => c.classList.toggle('is-hidden', g !== 'all' && c.dataset.group !== g));
    }, 'all');
  }

  // -------------------------------------------------------------------
  // Publications
  // -------------------------------------------------------------------
  const list = $('#pub-list');
  if (list && PUBS.length) {
    const state = { q: '', year: null, topic: 'All', type: '', sort: 'new', featured: false, shown: 15 };
    const PAGE = 15;

    // topics
    const topicCounts = {};
    PUBS.forEach(p => p.topics.forEach(t => topicCounts[t] = (topicCounts[t] || 0) + 1));
    const topics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
    makeChips($('#pub-topics'), [['All', 'All topics', PUBS.length], ...topics.map(([t, n]) => [t, t, n])], t => { state.topic = t; state.shown = PAGE; render(); }, 'All');

    // types
    const typeSel = $('#pub-type');
    [...new Set(PUBS.map(p => p.type))].sort().forEach(t => typeSel.insertAdjacentHTML('beforeend', `<option>${esc(t)}</option>`));
    typeSel.addEventListener('change', () => { state.type = typeSel.value; state.shown = PAGE; render(); });
    $('#pub-sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
    $('#pub-featured').addEventListener('change', e => { state.featured = e.target.checked; state.shown = PAGE; render(); });
    let deb;
    $('#pub-search').addEventListener('input', e => { clearTimeout(deb); deb = setTimeout(() => { state.q = e.target.value.trim(); state.shown = PAGE; render(); }, 120); });
    $('#pub-reset').addEventListener('click', () => {
      Object.assign(state, { q: '', year: null, topic: 'All', type: '', featured: false, shown: PAGE });
      $('#pub-search').value = ''; typeSel.value = ''; $('#pub-featured').checked = false;
      $$('#pub-topics .chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.v === 'All'));
      render();
    });
    $('#pub-more').addEventListener('click', () => { state.shown += PAGE; render(true); });

    const hl = (text, q) => {
      const t = esc(text);
      if (!q) return t;
      const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      return t.replace(re, '<mark>$1</mark>');
    };
    const cite = p => `${p.authors}. ${p.title}. ${p.journal}. ${p.year}.${p.doi ? ' doi:' + p.doi : ''} PMID: ${p.pmid}.`;

    function render(keepAnim) {
      const q = state.q.toLowerCase();
      let rows = PUBS.filter(p =>
        (!state.year || p.year === state.year) &&
        (state.topic === 'All' || p.topics.includes(state.topic)) &&
        (!state.type || p.type === state.type) &&
        (!state.featured || p.featured) &&
        (!q || [p.title, p.journal, p.authors, p.desc, p.type, ...p.topics].join(' ').toLowerCase().includes(q)));
      rows.sort(state.sort === 'old' ? (a, b) => a.year - b.year : state.sort === 'journal' ? (a, b) => a.journal.localeCompare(b.journal) : (a, b) => b.year - a.year);
      const total = rows.length;
      const filtered = state.q || state.year || state.topic !== 'All' || state.type || state.featured;
      $('#pub-count').textContent = `Showing ${Math.min(total, state.shown)} of ${total}${filtered ? ` (filtered from ${PUBS.length})` : ''} papers`;
      $('#pub-reset').hidden = !filtered;
      const start = keepAnim ? list.children.length : 0;
      rows = rows.slice(0, state.shown);
      const html = rows.map((p, i) => `
        <li class="pub" style="animation-delay:${Math.max(0, i - start) * 25}ms">
          <button type="button" class="pub-head" aria-expanded="false">
            <span class="pub-year">${p.year}</span>
            <span>
              <span class="pub-title">${hl(p.title, state.q)}${p.featured ? '<span class="star" title="Highlight">★</span>' : ''}</span>
              <span class="pub-meta"><i>${hl(p.journal, state.q)}</i> · ${esc(p.type)}</span>
              <span class="pub-desc" style="display:block">${hl(p.desc, state.q)}</span>
            </span>
            <span class="pub-chev" aria-hidden="true">▾</span>
          </button>
          <div class="pub-body"><div><div class="pub-detail">
            <div class="pub-authors">${hl(p.authors, state.q)}${p.nauthors > 6 ? ` <span class="muted">(${p.nauthors} authors)</span>` : ''}</div>
            <div class="pub-tags">${p.topics.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            <div class="pub-actions">
              <a href="https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/" target="_blank" rel="noopener">PubMed ↗</a>
              ${p.doi ? `<a href="https://doi.org/${esc(p.doi)}" target="_blank" rel="noopener">Full text (DOI) ↗</a>` : ''}
              <button type="button" data-cite="${esc(cite(p))}">Copy citation</button>
            </div>
          </div></div></div>
        </li>`).join('');
      list.innerHTML = html || '<li class="empty">No papers match. Try a different search or clear the filters.</li>';
      $('#pub-more').hidden = total <= state.shown;
      $('#pub-more').textContent = `Show ${Math.min(PAGE, total - state.shown)} more`;
    }

    list.addEventListener('click', e => {
      const c = e.target.closest('[data-cite]');
      if (c) {
        const text = c.dataset.cite;
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('Citation copied'), () => toast('Copy failed'));
        return;
      }
      const h = e.target.closest('.pub-head');
      if (h) { const li = h.parentElement; const open = li.classList.toggle('open'); h.setAttribute('aria-expanded', open); }
    });
    render();
  }

  // -------------------------------------------------------------------
  // Map
  // -------------------------------------------------------------------
  const SITES = [
    { name: 'Canada', coords: [49.28, -123.12], note: 'Vancouver: hospital, primary care, Indigenous health and TB studies', key: false },
    { name: 'Kenya', coords: [-1.29, 36.82], note: 'WelTel Kenya1, Retain and PMTCT trials', key: true },
    { name: 'Rwanda', coords: [-1.94, 30.06], note: 'COVID-19 response, CHW surveillance, MNCH, PPH, NLP', key: true },
    { name: 'Uganda', coords: [0.35, 32.58], note: 'mHealth adherence feasibility studies', key: true },
    { name: 'Cameroon', coords: [3.87, 11.52], note: 'CAMPS SMS adherence trial', key: false },
    { name: 'Ethiopia', coords: [9.03, 38.74], note: 'Research collaboration', key: false },
    { name: 'United States', coords: [38.9, -77.04], note: 'Academic collaborations', key: false },
    { name: 'United Kingdom', coords: [51.51, -0.13], note: 'Academic collaborations', key: false }
  ];
  const mapList = $('#map-list');
  mapList.innerHTML = SITES.map((s, i) => `<li><button type="button" data-i="${i}"><strong>${esc(s.name)}</strong><span>${esc(s.note)}</span></button></li>`).join('');

  const initMap = () => {
    if (!window.L || !$('#world-map')) return;
    const map = L.map('world-map', { center: [18, 10], zoom: 2, minZoom: 2, maxZoom: 7, scrollWheelZoom: false, worldCopyJump: true });
    const tiles = () => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`;
    const layer = L.tileLayer(tiles(), {
      attribution: 'Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors', maxZoom: 16
    }).addTo(map);
    const markers = SITES.map(s => L.marker(s.coords, {
      icon: L.divIcon({ className: '', html: `<div class="map-pin ${s.key ? 'key' : ''}"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] })
    }).addTo(map).bindPopup(`<strong>${esc(s.name)}</strong>${esc(s.note)}`));
    mapList.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const i = +b.dataset.i;
      $$('button', mapList).forEach(x => x.classList.toggle('on', x === b));
      map.flyTo(SITES[i].coords, 5, { duration: reduced ? 0 : 1.2 });
      setTimeout(() => markers[i].openPopup(), reduced ? 0 : 1200);
    });
    map.on('click', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());
  };
  if (window.L) initMap(); else addEventListener('load', initMap);

  // -------------------------------------------------------------------
  // News
  // -------------------------------------------------------------------
  const news = $('#news-list');
  if (news) news.innerHTML = (window.NEWS || []).map(n => `<li class="reveal"><span class="news-date">${esc(n.date)}</span><span><span class="tag">${esc(n.tag)}</span></span><span>${esc(n.text)}</span></li>`).join('');
  $$('#news-list .reveal').forEach(observeReveal);

  // -------------------------------------------------------------------
  // Toast
  // -------------------------------------------------------------------
  let toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }
})();
