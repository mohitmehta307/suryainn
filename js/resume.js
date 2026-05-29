/* ── RESUME JS ── */
(function () {

  /* ── THEME TOGGLE ── */
  const themeBtn  = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const saved = localStorage.getItem('resume-theme');
  if (saved === 'dark') { document.body.classList.add('dark'); themeIcon.className = 'fas fa-sun'; }

  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('resume-theme', isDark ? 'dark' : 'light');
  });

  /* ── AOS SCROLL REVEAL ── */
  const aosEls = document.querySelectorAll('[data-aos]');
  const aosObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  aosEls.forEach(el => aosObs.observe(el));

  /* ── SKILL BAR ANIMATION ── */
  const bars = document.querySelectorAll('.platform-fill');
  const barObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animated'); barObs.unobserve(e.target); } });
  }, { threshold: 0.3 });
  bars.forEach(b => barObs.observe(b));

  /* ── COUNT-UP STATS ── */
  const statNums = document.querySelectorAll('.stat-num');
  const statObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || (el.dataset.suffix === '' ? '' : '');
      const dur = 1200;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * ease) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      statObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  statNums.forEach(n => statObs.observe(n));

  /* ── TIMELINE LINE FILL on scroll ── */
  const tlItems = document.querySelectorAll('.tl-item');
  const tlObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.2 });
  tlItems.forEach(t => tlObs.observe(t));

  /* ── TOOLBAR SHRINK on scroll ── */
  const toolbar = document.getElementById('toolbar');
  window.addEventListener('scroll', () => {
    toolbar.style.boxShadow = window.scrollY > 10
      ? '0 2px 20px rgba(0,80,200,0.15)'
      : 'none';
  }, { passive: true });

})();
