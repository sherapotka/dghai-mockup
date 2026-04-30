/* =====================================================================
   mHealth Research Group mockup — interactive behaviour
   - Smooth tab scrolling
   - Scrollspy active-tab highlighting
   - IntersectionObserver fade-in for .reveal elements
   - Stat counter animation
   - Lazy YouTube iframe modal for the WelTel video
   No external dependencies.
   ===================================================================== */

(() => {
  'use strict';

  // -------------------------------------------------------------------
  // 1. Smooth scroll on tab clicks (and any in-page anchor link)
  // -------------------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  // -------------------------------------------------------------------
  // 2. Scrollspy — set the active tab based on which section is in view
  // -------------------------------------------------------------------
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabSections = ['goals', 'mhealth', 'team', 'works']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (tabLinks.length && tabSections.length && 'IntersectionObserver' in window) {
    const setActive = id => {
      tabLinks.forEach(t => {
        const matches = t.getAttribute('href') === '#' + id;
        t.classList.toggle('active', matches);
      });
    };

    const obs = new IntersectionObserver(entries => {
      // Pick the entry closest to the top of the viewport that is intersecting.
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-80px 0px -55% 0px', threshold: 0 });

    tabSections.forEach(s => obs.observe(s));
  }

  // -------------------------------------------------------------------
  // 3. Reveal-on-scroll for any element with .reveal
  // -------------------------------------------------------------------
  if ('IntersectionObserver' in window) {
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0.05 });

    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // -------------------------------------------------------------------
  // 4. Interactive world map (Leaflet)
  // -------------------------------------------------------------------
  const mapEl = document.getElementById('world-map');
  if (mapEl && window.L) {
    const map = L.map('world-map', {
      center: [25, 15],
      zoom: 2,
      minZoom: 2,
      maxZoom: 5,
      worldCopyJump: false,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    // Clean light tile layer (CARTO Positron) — minimal, almost greyscale
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const countries = [
      { name: 'Canada',   coords: [49.28, -123.12], note: 'Vancouver · BC clinical sites',  key: false },
      { name: 'USA',      coords: [37.09,  -95.71], note: 'Collaborative research',          key: false },
      { name: 'United Kingdom', coords: [51.51,   -0.13], note: 'Academic partnerships',     key: false },
      { name: 'Kenya',    coords: [-1.29,  36.82], note: 'WelTel Kenya1 / Kenya2 trial sites', key: true },
      { name: 'Uganda',   coords: [ 0.35,  32.58], note: 'Implementation partner',           key: true },
      { name: 'Rwanda',   coords: [-1.94,  30.06], note: 'CHW digital health · MNCH · RBC',  key: true },
      { name: 'Ethiopia', coords: [ 9.03,  38.74], note: 'Active research site',             key: true },
    ];

    countries.forEach(c => {
      const cls = 'map-marker' + (c.key ? ' map-marker-key' : '');
      const size = c.key ? 16 : 14;
      const icon = L.divIcon({
        className: cls,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker(c.coords, { icon }).addTo(map)
        .bindPopup(
          '<div class="popup-country">' + c.name + '</div>' +
          '<div class="popup-meta">' + c.note + '</div>'
        );
    });

    // disable zoom on first scroll, enable when user clicks the map
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur',  () => map.scrollWheelZoom.disable());
  }

  // -------------------------------------------------------------------
  // 5. Video modal — open YouTube iframe on demand
  // -------------------------------------------------------------------
  const modal = document.getElementById('video-modal');
  const modalFrame = document.getElementById('video-modal-iframe');
  const triggers = document.querySelectorAll('[data-video]');

  const openModal = videoId => {
    if (!modal || !modalFrame) return;
    modalFrame.innerHTML =
      '<iframe src="https://www.youtube-nocookie.com/embed/' + videoId +
      '?autoplay=1&rel=0" title="WelTel video" frameborder="0" ' +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; ' +
      'gyroscope; picture-in-picture" allowfullscreen></iframe>';
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    if (!modal || !modalFrame) return;
    modalFrame.innerHTML = '';
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  triggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-video');
      if (id) openModal(id);
    });
  });

  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target.matches('[data-close]')) closeModal();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
  }
})();
