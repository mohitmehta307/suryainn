/* ══════════════════════════════════════
   SCROLL WALKER — mountain traveller
   ══════════════════════════════════════ */
(function () {
  'use strict';

  const strip   = document.getElementById('walker-strip');
  const scene   = strip && strip.querySelector('.walker-scene');
  if (!strip || !scene) return;

  /* ── elements ── */
  const sky       = scene.querySelector('.ws-sky');
  const layerFar  = scene.querySelector('.ws-mountains-far');
  const layerMid  = scene.querySelector('.ws-mountains-mid');
  const layerNear = scene.querySelector('.ws-mountains-near');
  const treesWrap = document.getElementById('wsTrees');
  const markers   = Array.from(scene.querySelectorAll('.ws-marker'));
  const walker    = document.getElementById('wsWalker');
  const kmDisplay = document.getElementById('wsKm');
  const hint      = document.getElementById('wsHint');

  // SVG limb elements
  const wLegL  = document.getElementById('wLegL');
  const wLegR  = document.getElementById('wLegR');
  const wBootL = document.getElementById('wBootL');
  const wBootR = document.getElementById('wBootR');
  const wArmL  = document.getElementById('wArmL');
  const wArmR  = document.getElementById('wArmR');
  const wStick = document.getElementById('wStick');

  /* ── progress bar ── */
  const progressBar = document.createElement('div');
  progressBar.className = 'ws-progress-bar';
  scene.appendChild(progressBar);

  /* ── generate trees ── */
  const TREE_COUNT = 60;
  const totalPathW = window.innerWidth * 5;
  for (let i = 0; i < TREE_COUNT; i++) {
    const t = document.createElement('div');
    t.className = 'ws-tree';
    const side  = i % 2 === 0 ? 'left' : 'right';
    const xPos  = (i / TREE_COUNT) * 110 - 5; // % of markers width
    const xPx   = (totalPathW * xPos / 100);
    const h     = 32 + Math.random() * 48;
    const w     = h * 0.55;
    const offY  = side === 'left' ? '-2px' : '2px';
    const offX  = side === 'left'
      ? `calc(50% - ${30 + Math.random() * 120}px)`
      : `calc(50% + ${30 + Math.random() * 120}px)`;

    t.style.cssText = `
      left: ${xPx}px;
      bottom: ${offY};
    `;
    // SVG pine inline
    t.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;position:absolute;left:${offX};transform:translateX(-50%)">
      <polygon points="${w/2},0 0,${h*0.65} ${w},${h*0.65}" fill="#0d2018" opacity="${0.7 + Math.random()*0.3}"/>
      <polygon points="${w/2},${h*0.3} ${w*0.08},${h} ${w*0.92},${h}" fill="#0f2a1e" opacity="${0.6+Math.random()*0.3}"/>
    </svg>`;
    treesWrap.appendChild(t);
  }

  /* ── marker positions (as % of total scroll) ── */
  const MARKER_KM   = [0, 2, 12, 18, 25];
  const MAX_KM      = 30;
  // Place markers in the ws-markers element
  const markersEl = scene.querySelector('.ws-markers');
  // width of ws-markers = 500vw, so position markers proportionally
  markers.forEach((m, i) => {
    const pct = MARKER_KM[i] / MAX_KM * 100;
    m.style.left = pct + '%';
  });

  /* ── scroll math ── */
  function getProgress() {
    const rect = strip.getBoundingClientRect();
    const total = strip.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    return Math.max(0, Math.min(1, scrolled / total));
  }

  /* ── walking animation ── */
  let lastP = 0;
  let walkPhase = 0;
  let walking = false;

  function animateWalker(p) {
    const delta = p - lastP;
    const speed = Math.abs(delta) * 300;
    walking = speed > 0.001;

    if (!walking) { return; }

    walkPhase += speed * 14;
    const swing = Math.sin(walkPhase) * 14;  // degrees

    /* Legs — alternating swing */
    if (wLegL && wLegR) {
      // Left leg pivot at hip (18,42)
      const lA = swing;
      const rA = -swing;
      const hipLX = 18, hipLY = 42;
      const hipRX = 24, hipRY = 42;
      const len = 20;

      const lX2 = hipLX + Math.sin(lA * Math.PI/180) * len;
      const lY2 = hipLY + Math.cos(lA * Math.PI/180) * len;
      const rX2 = hipRX + Math.sin(rA * Math.PI/180) * len;
      const rY2 = hipRY + Math.cos(rA * Math.PI/180) * len;

      wLegL.setAttribute('x2', lX2.toFixed(1));
      wLegL.setAttribute('y2', lY2.toFixed(1));
      wLegR.setAttribute('x2', rX2.toFixed(1));
      wLegR.setAttribute('y2', rY2.toFixed(1));

      // Boots follow legs
      if (wBootL) { wBootL.setAttribute('cx', lX2.toFixed(1)); wBootL.setAttribute('cy', (lY2+1).toFixed(1)); }
      if (wBootR) { wBootR.setAttribute('cx', rX2.toFixed(1)); wBootR.setAttribute('cy', (rY2+1).toFixed(1)); }
    }

    /* Arms — counter-swing */
    if (wArmL) {
      const aL = -swing * 0.6;
      const aX2 = 15 + Math.sin(aL * Math.PI/180) * 10;
      const aY2 = 26 + Math.cos(aL * Math.PI/180) * 10;
      wArmL.setAttribute('x2', aX2.toFixed(1));
      wArmL.setAttribute('y2', aY2.toFixed(1));
    }
    if (wArmR && wStick) {
      const aR = swing * 0.4;
      const aX2 = 27 + Math.sin(aR * Math.PI/180) * 9;
      const aY2 = 26 + Math.cos(aR * Math.PI/180) * 9;
      wArmR.setAttribute('x2', aX2.toFixed(1));
      wArmR.setAttribute('y2', aY2.toFixed(1));
      // Stick follows arm end
      const stX2 = aX2 + Math.sin(aR * Math.PI/180) * 16;
      const stY2 = aY2 + Math.cos(aR * Math.PI/180) * 16;
      wStick.setAttribute('x1', aX2.toFixed(1));
      wStick.setAttribute('y1', aY2.toFixed(1));
      wStick.setAttribute('x2', stX2.toFixed(1));
      wStick.setAttribute('y2', stY2.toFixed(1));
    }

    /* Body subtle bob */
    const bob = Math.abs(Math.sin(walkPhase)) * 1.5;
    if (walker) walker.style.transform = `translateY(${-bob}px)`;

    lastP = p;
  }

  /* ── sky tint by progress ── */
  function updateSky(p) {
    if (!sky) return;
    sky.className = 'ws-sky';
    if      (p < 0.25) sky.classList.add('dawn');
    else if (p < 0.55) sky.classList.add('day');
    else if (p < 0.80) sky.classList.add('dusk');
    else               sky.classList.add('night');
  }

  /* ── parallax layers ── */
  function updateLayers(p) {
    const W = scene.offsetWidth;
    // Shift layers at different speeds for depth
    if (layerFar)  layerFar.style.transform  = `translateX(${-p * W * 0.15}px)`;
    if (layerMid)  layerMid.style.transform  = `translateX(${-p * W * 0.28}px)`;
    if (layerNear) layerNear.style.transform = `translateX(${-p * W * 0.45}px)`;
    // Trees + markers scroll faster (they're "close")
    if (treesWrap)   treesWrap.style.transform   = `translateX(${-p * W * 2.0}px)`;
    if (markersEl)   markersEl.style.transform   = `translateX(${-p * W * 1.8}px)`;
  }

  /* ── km counter ── */
  function updateKm(p) {
    const km = (p * MAX_KM).toFixed(1);
    if (kmDisplay) kmDisplay.textContent = km;
  }

  /* ── reveal markers when they pass into view ── */
  function updateMarkers(p) {
    const W = scene.offsetWidth;
    const shift = p * W * 1.8;  // must match markersEl translate
    const containerW = markersEl ? markersEl.offsetWidth : W * 5;

    markers.forEach((m, i) => {
      const pct = MARKER_KM[i] / MAX_KM;
      const markerX = pct * containerW - shift;
      const inView = markerX > -100 && markerX < W + 100;
      m.classList.toggle('visible', inView);
    });
  }

  /* ── progress bar ── */
  function updateProgress(p) {
    progressBar.style.width = (p * 100) + '%';
  }

  /* ── hide hint after first scroll ── */
  let hintHidden = false;
  function hideHint() {
    if (!hintHidden && hint) {
      hint.classList.add('hidden');
      hintHidden = true;
    }
  }

  /* ── main scroll handler ── */
  function onScroll() {
    const p = getProgress();
    if (p <= 0 || p >= 1) return; // outside strip

    animateWalker(p);
    updateSky(p);
    updateLayers(p);
    updateKm(p);
    updateMarkers(p);
    updateProgress(p);
    if (p > 0.02) hideHint();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── dust animation only when walking ── */
  const dustEl = document.getElementById('wsDust');
  let dustAnim;
  function updateDust() {
    const p = getProgress();
    const delta = Math.abs(p - lastP);
    if (dustEl) {
      dustEl.style.display = delta > 0.0005 ? 'flex' : 'none';
    }
    requestAnimationFrame(updateDust);
  }
  requestAnimationFrame(updateDust);

  /* ── initial state ── */
  onScroll();

})();
