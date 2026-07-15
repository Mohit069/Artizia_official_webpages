/* ============================================================
   ARTIZIA — drill-down world map
   Shared by the home page (S11) and the About page.

   One SVG, zoomed by animating its viewBox from the world down to Jaipur.
   The frame and every view share the map's 1000x620 aspect, so a map
   coordinate maps to a plain percentage of the box — which is how the
   HTML pins stay glued to their location at any zoom.

   Geometry comes from assets/js/map.js (window.MAPDATA), baked offline
   from public-domain Natural Earth data. Load map.js first.

   Usage:  buildWorldMap(hostEl, globalConfig, window.MAPDATA)
   ============================================================ */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function buildWorldMap(host, g, M) {
    if (!host || !M) return;
    const AR = M.h / M.w, RAD = Math.PI / 180;

    /* Natural Earth 1, the same projection the geometry was baked with —
       so a lat/lon in the content block lands exactly where it should. */
    function project(lon, lat) {
      const l = lon * RAD, p = lat * RAD, p2 = p * p, p4 = p2 * p2;
      const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 - 0.001529 * p2)));
      const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
      return [M.t[0] + M.k * x, M.t[1] - M.k * y];
    }

    const stops = (g.stops && g.stops.length) ? g.stops : [{ view: 'world', label: 'World' }];
    const home = g.home || {};
    const marks = (home.lat != null ? [Object.assign({ home: true }, home)] : []).concat(g.pins || []);

    host.innerHTML = `<div class="dots"></div>
      <svg viewBox="0 0 ${M.w} ${M.h}" aria-hidden="true">
        <path class="wm-land" d="${M.land}"/>
        <path class="wm-india" d="${M.india}"/>
        <path class="wm-states" d="${M.states}"/>
        <path class="wm-raj" d="${M.rajasthan}"/>
      </svg>
      <div class="wm-pins">${marks.map((p, i) => p.home
        ? `<span class="home-pin" data-i="${i}" data-role="home">${esc(p.label || '')}</span><span class="pin" data-i="${i}" data-role="home"></span>${p.note ? `<span class="wm-note" data-i="${i}" data-role="home">${esc(p.note)}</span>` : ''}`
        : `<span class="pin d${(i % 3) + 1}" data-i="${i}" data-role="away" title="${esc(p.label || '')}"></span>`).join('')}</div>
      <div class="wm-steps">${stops.map((s, i) => `<button type="button" data-v="${esc(s.view)}"${i ? '' : ' class="on"'}>${esc(s.label)}</button>`).join('')}</div>`;

    const svg = host.querySelector('svg');
    const states = host.querySelector('.wm-states');
    const raj = host.querySelector('.wm-raj');
    const steps = host.querySelector('.wm-steps');
    const pins = [...host.querySelectorAll('[data-i]')];
    const pts = marks.map(p => project(p.lon, p.lat));

    const ramp = (a, b, v) => Math.max(0, Math.min(1, (v - a) / (b - a)));
    let vb = M.views.world.slice(), raf = 0, auto = true;

    function paint() {
      svg.setAttribute('viewBox', vb.map(n => n.toFixed(2)).join(' '));
      const z = M.w / vb[2];                       /* 1 at world, ~33 at Jaipur */
      states.style.opacity = ramp(1.7, 3.6, z) * .38;
      raj.style.opacity = ramp(3.4, 8, z) * .30;
      const homeOp = ramp(2.4, 5, z), awayOp = 1 - ramp(2.5, 5, z);
      for (const el of pins) {
        const [px, py] = pts[+el.dataset.i];
        el.style.left = ((px - vb[0]) / vb[2] * 100) + '%';
        el.style.top = ((py - vb[1]) / vb[3] * 100) + '%';
        el.style.opacity = el.dataset.role === 'home' ? homeOp : awayOp;
      }
    }

    /* zoom geometrically, not linearly — a straight lerp from a 1000-wide
       view to a 30-wide one lurches at the end */
    function goTo(view, animate) {
      const to = M.views[view] || M.views.world;
      cancelAnimationFrame(raf);
      if (!animate || reduce) { vb = to.slice(); paint(); return; }
      const from = vb.slice(), t0 = performance.now(), DUR = 1200;
      const ax = from[0] + from[2] / 2, ay = from[1] + from[3] / 2, aw = from[2];
      const bx = to[0] + to[2] / 2, by = to[1] + to[3] / 2, bw = to[2];
      (function step(now) {
        const p = Math.min(1, (now - t0) / DUR);
        const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const w = aw * Math.pow(bw / aw, e);
        const cx = ax + (bx - ax) * e, cy = ay + (by - ay) * e;
        vb = [cx - w / 2, cy - w * AR / 2, w, w * AR];
        paint();
        if (p < 1) raf = requestAnimationFrame(step);
      })(t0);
    }

    const mark = v => [...steps.children].forEach(b => b.classList.toggle('on', b.dataset.v === v));
    steps.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      auto = false;                     /* a click ends the guided tour */
      mark(b.dataset.v);
      goTo(b.dataset.v, true);
    });

    paint();
    /* drill in once, the first time the map is actually looked at */
    if (!reduce && stops.length > 1) {
      const io = new IntersectionObserver(en => {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        let i = 0;
        const hop = () => {
          if (!auto || ++i >= stops.length) return;
          mark(stops[i].view);
          goTo(stops[i].view, true);
          setTimeout(hop, 1900);
        };
        setTimeout(hop, 900);        /* let it read as a world map first */
      }, { threshold: .35 });
      io.observe(host);
    }
  }

  window.buildWorldMap = buildWorldMap;
})();
