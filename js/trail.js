/* ══════════════════════════════════════
   SCROLL TRAIL — mountain path tracker
   ══════════════════════════════════════ */
(function () {
  'use strict';

  /* ── build the fixed trail DOM ── */
  const trail = document.createElement('div');
  trail.id = 'scroll-trail';

  const W = 48, H = window.innerHeight;

  // Winding path control points — a gentle S-curve
  // x oscillates between 8 and 40, y goes 0 → H
  function buildPathD(h) {
    const pts = [];
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = t * h;
      const x = 24 + Math.sin(t * Math.PI * 3.5) * 14;
      pts.push([x, y]);
    }
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += ` Q ${pts[i][0]} ${pts[i][1]} ${mx} ${my}`;
    }
    d += ` L ${pts[pts.length-1][0]} ${pts[pts.length-1][1]}`;
    return d;
  }

  const pathD = buildPathD(H);

  trail.innerHTML = `
    <svg id="trail-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stop-color="#c9a84c" stop-opacity="0.3"/>
          <stop offset="40%"  stop-color="#c9a84c" stop-opacity="1"/>
          <stop offset="70%"  stop-color="#e8c97a" stop-opacity="1"/>
          <stop offset="100%" stop-color="#c8956c" stop-opacity="0.5"/>
        </linearGradient>
      </defs>
      <path id="trail-path-bg" d="${pathD}"/>
      <path id="trail-path-fg" d="${pathD}"/>
    </svg>
    <div id="trail-hiker">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <!-- hiker silhouette -->
        <circle cx="12" cy="4"  r="2.8" fill="#e8c97a"/>
        <line x1="12" y1="7"  x2="12" y2="15" stroke="#c9a84c" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="10" x2="8"  y2="13" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="12" y1="10" x2="16" y2="14" stroke="#c9a84c" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="12" y1="15" x2="9"  y2="21" stroke="#c9a84c" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="15" x2="15" y2="21" stroke="#c9a84c" stroke-width="2" stroke-linecap="round"/>
        <!-- walking stick -->
        <line x1="16" y1="14" x2="18" y2="21" stroke="#8b5e3c" stroke-width="1.5" stroke-linecap="round"/>
        <!-- glow ring -->
        <circle cx="12" cy="4" r="4" fill="none" stroke="rgba(201,168,76,0.3)" stroke-width="1"/>
      </svg>
    </div>
    <div id="trail-pct">0%</div>`;

  document.body.appendChild(trail);

  /* ── section stop markers ── */
  const STOPS = [
    { id: 'home',       label: 'Home'       },
    { id: 'about',      label: 'About'      },
    { id: 'rooms',      label: 'Rooms'      },
    { id: 'events',     label: 'Events'     },
    { id: 'itinerary',  label: 'Journey'    },
    { id: 'experience', label: 'Experiences'},
    { id: 'gallery',    label: 'Gallery'    },
    { id: 'contact',    label: 'Contact'    },
  ];

  const stopEls = [];
  STOPS.forEach(s => {
    const el = document.createElement('div');
    el.className = 'trail-stop';
    el.dataset.section = s.id;
    el.innerHTML = `<div class="trail-stop-dot"></div><div class="trail-stop-label">${s.label}</div>`;
    trail.appendChild(el);
    stopEls.push(el);
  });

  /* ── get path geometry ── */
  const fgPath = document.getElementById('trail-path-fg');
  const hiker  = document.getElementById('trail-hiker');
  const pctEl  = document.getElementById('trail-pct');

  const pathLen = fgPath.getTotalLength();
  fgPath.style.strokeDasharray  = pathLen;
  fgPath.style.strokeDashoffset = pathLen; // start fully hidden

  /* ── position stops on the path ── */
  function positionStops() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    STOPS.forEach((s, i) => {
      const section = document.getElementById(s.id);
      if (!section) return;
      // What scroll % does this section start at?
      const sectionTop = section.offsetTop;
      const pct = Math.min(sectionTop / docH, 1);
      // Where on the path is that?
      const pt = fgPath.getPointAtLength(pct * pathLen);
      stopEls[i].style.top  = pt.y + 'px';
      stopEls[i].style.left = pt.x + 'px';
    });
  }

  /* ── scroll update ── */
  let raf;
  function onScroll() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(update);
  }

  function update() {
    const scrollY = window.scrollY;
    const docH    = document.documentElement.scrollHeight - window.innerHeight;
    const p       = Math.max(0, Math.min(1, scrollY / docH));

    // Draw the path up to current scroll
    fgPath.style.strokeDashoffset = pathLen * (1 - p);

    // Move hiker along path
    const drawn = p * pathLen;
    const pt    = fgPath.getPointAtLength(drawn);
    hiker.style.left = pt.x + 'px';
    hiker.style.top  = pt.y + 'px';

    // Rotate hiker to follow path tangent
    const ahead = fgPath.getPointAtLength(Math.min(drawn + 4, pathLen));
    const angle = Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180 / Math.PI;
    hiker.style.transform = `translate(-50%, -50%) rotate(${angle - 90}deg)`;

    // Percentage label
    pctEl.textContent = Math.round(p * 100) + '%';

    // Reveal section stops when hiker passes them
    const docH2 = document.documentElement.scrollHeight - window.innerHeight;
    STOPS.forEach((s, i) => {
      const section = document.getElementById(s.id);
      if (!section) return;
      const sTop = section.offsetTop / docH2;
      stopEls[i].classList.toggle('visible', p >= sTop - 0.02 && p <= sTop + 0.15);
    });
  }

  /* ── resize ── */
  function onResize() {
    // Rebuild SVG path for new viewport height
    const newH = window.innerHeight;
    const newD = buildPathD(newH);
    document.getElementById('trail-path-bg').setAttribute('d', newD);
    fgPath.setAttribute('d', newD);
    document.getElementById('trail-svg').setAttribute('viewBox', `0 0 ${W} ${newH}`);
    const newLen = fgPath.getTotalLength();
    fgPath.style.strokeDasharray = newLen;
    positionStops();
    update();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  // Run after layout settles
  setTimeout(() => { positionStops(); update(); }, 400);

})();
