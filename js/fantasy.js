/* ══════════════════════════════════════════════════════════
   SURYA INN — FANTASY MOUNTAIN ATMOSPHERE
   Loader · Leaves · Mist · Fireflies · Parallax · Cursor
   ══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ════════════════════════════════
     1. LOADING SCREEN
     ════════════════════════════════ */
  const loader = document.getElementById('fantasy-loader');
  if (loader) {
    const bar = loader.querySelector('.loader-bar');
    setTimeout(() => bar && bar.classList.add('go'), 50);
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('hide'), 200);
      setTimeout(() => loader.remove(), 700);
    });
    // Fallback: hide after 800ms regardless
    setTimeout(() => loader && loader.classList.add('hide'), 800);
  }

  /* ════════════════════════════════
     2. CURSOR GLOW
     ════════════════════════════════ */
  const glow = document.querySelector('.cursor-glow');
  if (glow && window.matchMedia('(hover: hover)').matches) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    function animateGlow() {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      glow.style.transform = `translate(${cx - 175}px, ${cy - 175}px)`;
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }

  /* ════════════════════════════════
     3. FALLING LEAVES  (canvas)
     ════════════════════════════════ */
  const canvas = document.getElementById('fantasy-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Leaf colours — mountain autumn palette
  const LEAF_COLORS = [
    '#4a7c3f', '#6aab50', '#3d6b35',
    '#c9a84c', '#d4884a', '#8b5e3c',
    '#a0c878', '#e8c97a'
  ];

  // Leaf shapes: we draw organic tear-drop leaves
  function drawLeaf(ctx, x, y, size, angle, color, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(size * 0.6, -size * 0.4, size * 0.8, size * 0.2, 0, size);
    ctx.bezierCurveTo(-size * 0.8, size * 0.2, -size * 0.6, -size * 0.4, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    // Leaf vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, size * 0.85);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }

  class Leaf {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x    = Math.random() * canvas.width;
      this.y    = init ? Math.random() * canvas.height : -20;
      this.size = 5 + Math.random() * 8;
      this.speedY = 0.4 + Math.random() * 0.9;
      this.speedX = (Math.random() - 0.5) * 0.8;
      this.swing  = Math.random() * Math.PI * 2;
      this.swingSpeed = 0.012 + Math.random() * 0.018;
      this.swingAmp   = 15 + Math.random() * 25;
      this.angle  = Math.random() * Math.PI * 2;
      this.spin   = (Math.random() - 0.5) * 0.04;
      this.color  = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
      this.opacity = 0.6 + Math.random() * 0.4;
    }
    update() {
      this.swing += this.swingSpeed;
      this.x += this.speedX + Math.sin(this.swing) * 0.6;
      this.y += this.speedY;
      this.angle += this.spin;
      // Wind influence
      this.x += windForce * 0.3;
      if (this.y > canvas.height + 20) this.reset();
    }
    draw() {
      drawLeaf(ctx, this.x, this.y, this.size, this.angle, this.color, this.opacity);
    }
  }

  const LEAF_COUNT = window.innerWidth < 768 ? 12 : 22;
  const leaves = Array.from({ length: LEAF_COUNT }, () => new Leaf());

  /* ════════════════════════════════
     4. FIREFLIES  (same canvas)
     ════════════════════════════════ */
  class Firefly {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * canvas.width;
      this.y  = canvas.height * 0.3 + Math.random() * canvas.height * 0.7;
      this.r  = 1.2 + Math.random() * 2;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.phase = Math.random() * Math.PI * 2;
      this.blinkSpeed = 0.025 + Math.random() * 0.04;
      this.maxOpacity = 0.5 + Math.random() * 0.5;
    }
    update() {
      this.phase += this.blinkSpeed;
      this.x += this.vx + (Math.random() - 0.5) * 0.15;
      this.y += this.vy + (Math.random() - 0.5) * 0.1;
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < canvas.height * 0.3 || this.y > canvas.height) this.vy *= -1;
    }
    get opacity() { return (Math.sin(this.phase) * 0.5 + 0.5) * this.maxOpacity; }
    draw() {
      const o = this.opacity;
      if (o < 0.02) return;
      // Soft glow
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 6);
      grad.addColorStop(0,   `rgba(200,240,140,${o})`);
      grad.addColorStop(0.3, `rgba(180,230,100,${o * 0.5})`);
      grad.addColorStop(1,   'transparent');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      // Core dot
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,255,160,${o})`;
      ctx.fill();
    }
  }

  const FIREFLY_COUNT = window.innerWidth < 768 ? 18 : 38;
  const fireflies = Array.from({ length: FIREFLY_COUNT }, () => new Firefly());

  /* ════════════════════════════════
     5. MIST WISPS  (canvas)
     ════════════════════════════════ */
  class MistWisp {
    constructor() { this.reset(); }
    reset() {
      this.x = -200 + Math.random() * (canvas.width + 400);
      this.y = canvas.height * (0.3 + Math.random() * 0.5);
      this.w = 200 + Math.random() * 400;
      this.h = 40 + Math.random() * 80;
      this.speedX = 0.08 + Math.random() * 0.15;
      this.opacity = 0;
      this.targetOpacity = 0.03 + Math.random() * 0.06;
      this.life = 0;
      this.maxLife = 500 + Math.random() * 800;
    }
    update() {
      this.x += this.speedX + windForce * 0.2;
      this.life++;
      const t = this.life / this.maxLife;
      if (t < 0.15)      this.opacity = (t / 0.15) * this.targetOpacity;
      else if (t < 0.75) this.opacity = this.targetOpacity;
      else               this.opacity = ((1 - t) / 0.25) * this.targetOpacity;
      if (this.life > this.maxLife || this.x > canvas.width + 400) this.reset();
    }
    draw() {
      if (this.opacity < 0.005) return;
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.w);
      grad.addColorStop(0,   `rgba(255,255,255,${this.opacity})`);
      grad.addColorStop(0.5, `rgba(220,240,230,${this.opacity * 0.5})`);
      grad.addColorStop(1,   'transparent');
      ctx.save();
      ctx.scale(1, this.h / this.w * 0.4);
      ctx.beginPath();
      ctx.arc(this.x, this.y * (this.w / this.h) * 2.5, this.w, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    }
  }

  const MIST_COUNT = window.innerWidth < 768 ? 3 : 6;
  const misties = Array.from({ length: MIST_COUNT }, () => new MistWisp());

  /* ════════════════════════════════
     6. WIND FORCE (responds to mouse)
     ════════════════════════════════ */
  let windForce = 0.3;
  let lastMouseX = -1;
  document.addEventListener('mousemove', e => {
    if (lastMouseX > 0) {
      const dx = e.clientX - lastMouseX;
      windForce = Math.max(-2, Math.min(2, windForce + dx * 0.003));
    }
    lastMouseX = e.clientX;
    windForce += (0.3 - windForce) * 0.04; // drift back to default
  }, { passive: true });

  // Natural wind oscillation
  let windTime = 0;
  function naturalWind() {
    windTime += 0.002;
    windForce += (Math.sin(windTime) * 0.5 - windForce) * 0.008;
  }

  /* ════════════════════════════════
     7. MAIN ANIMATION LOOP
     ════════════════════════════════ */
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    naturalWind();

    // Draw mist (bottom layers)
    misties.forEach(m => { m.update(); m.draw(); });

    // Draw fireflies (show only when experience section is near)
    const expSection = document.getElementById('experience');
    if (expSection) {
      const rect = expSection.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.2 && rect.bottom > -200) {
        fireflies.forEach(f => { f.update(); f.draw(); });
      }
    } else {
      fireflies.forEach(f => { f.update(); f.draw(); });
    }

    // Draw leaves (always)
    leaves.forEach(l => { l.update(); l.draw(); });

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ════════════════════════════════
     8. SECTION PARALLAX on SCROLL
     ════════════════════════════════ */
  const parallaxEls = document.querySelectorAll('[data-depth]');
  function onScroll() {
    const scrollY = window.scrollY;
    parallaxEls.forEach(el => {
      const depth = parseFloat(el.dataset.depth) || 0.1;
      const offset = scrollY * depth;
      el.style.transform = `translateY(${offset}px)`;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ════════════════════════════════
     9. MOUSE PARALLAX on hero
     ════════════════════════════════ */
  const heroSection = document.getElementById('home');
  if (heroSection) {
    heroSection.addEventListener('mousemove', e => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      const orbs = heroSection.querySelectorAll('.hero-orb');
      orbs.forEach((orb, i) => {
        const depth = (i + 1) * 12;
        orb.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
      });
    });
  }

  /* ════════════════════════════════
     10. FANCY SCROLL REVEAL
     ════════════════════════════════ */
  const revealEls = document.querySelectorAll('.fantasy-reveal');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('revealed'), i * 80);
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => revealObs.observe(el));

  /* ════════════════════════════════
     11. EXPERIENCE SCROLL BUTTONS
     ════════════════════════════════ */
  const expLeft  = document.querySelector('.exp-scroll-left');
  const expRight = document.querySelector('.exp-scroll-right');
  const expScroll = document.querySelector('.exp-scroll');
  if (expLeft && expRight && expScroll) {
    const step = 300;
    expLeft.addEventListener('click',  () => expScroll.scrollBy({ left: -step, behavior: 'smooth' }));
    expRight.addEventListener('click', () => expScroll.scrollBy({ left:  step, behavior: 'smooth' }));
  }

  /* ════════════════════════════════
     12. WIND STREAK GENERATOR
     ════════════════════════════════ */
  function spawnWindStreak() {
    // Only on hero/experience/itinerary dark sections
    const darkSections = ['home', 'experience', 'itinerary'];
    const atSection = darkSections.some(id => {
      const s = document.getElementById(id);
      if (!s) return false;
      const r = s.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    if (!atSection) { setTimeout(spawnWindStreak, 1200); return; }

    const streak = document.createElement('div');
    streak.className = 'wind-streak';
    streak.style.cssText = `
      top: ${10 + Math.random() * 80}vh;
      width: ${80 + Math.random() * 200}px;
      left: 0;
      animation-duration: ${1.2 + Math.random() * 1.8}s;
      animation-delay: 0s;
      opacity: ${0.3 + Math.random() * 0.4};
    `;
    document.body.appendChild(streak);
    setTimeout(() => streak.remove(), 3500);
    setTimeout(spawnWindStreak, 600 + Math.random() * 1400);
  }
  setTimeout(spawnWindStreak, 2000);

  /* pine silhouette removed — was causing black bar at hero bottom */

  /* ════════════════════════════════
     14. MOUNTAIN SECTION DIVIDERS
     ════════════════════════════════ */
  const dividerData = [
    { after: 'about',      fill: '#f0ebe1', bg: '#1e3a2f' },
    { after: 'rooms',      fill: '#1e3a2f', bg: '#f0ebe1', flip: true },
    { after: 'experience', fill: '#faf8f4', bg: '#1e3a2f', flip: true },
  ];
  dividerData.forEach(({ after, fill, flip }) => {
    const sec = document.getElementById(after);
    if (!sec) return;
    const div = document.createElement('div');
    div.className = 'mountain-divider' + (flip ? ' flip' : '');
    div.style.background = 'transparent';
    div.innerHTML = `<svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
      <path d="M0,60 L0,35 L80,20 L160,38 L240,15 L320,32 L400,10 L480,28 L560,18 L640,35 L720,8 L800,26 L880,14 L960,32 L1040,20 L1120,38 L1200,16 L1280,30 L1360,22 L1440,40 L1440,60 Z" fill="${fill}"/>
    </svg>`;
    sec.insertAdjacentElement('afterend', div);
  });

  /* ════════════════════════════════
     15. APPLY fantasy-reveal to key elements
     ════════════════════════════════ */
  const revealTargets = [
    '.room-category-hero',
    '.event-split',
    '.testi-card',
    '.exp-card',
    '.stop-card',
    '.cert-card',
  ];
  revealTargets.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('fantasy-reveal');
      el.style.transitionDelay = (i % 4) * 0.08 + 's';
    });
  });
  // Re-observe after adding class
  document.querySelectorAll('.fantasy-reveal').forEach(el => revealObs.observe(el));

})();
