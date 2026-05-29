/* ─── ITINERARY ANIMATIONS ─── */
(function () {
  'use strict';

  const section   = document.getElementById('itinerary');
  if (!section) return;

  const car       = document.getElementById('itinCar');
  const stops     = Array.from(document.querySelectorAll('.journey-stop'));
  const connectors = Array.from(document.querySelectorAll('.connector-progress'));
  const ranges    = document.querySelectorAll('.itin-range-far, .itin-range-mid, .itin-range-near');
  const clouds    = document.querySelectorAll('.itin-cloud');

  /* ── Parallax mountains & clouds on scroll ── */
  window.addEventListener('scroll', onScroll, { passive: true });

  function onScroll() {
    const sectionTop = section.getBoundingClientRect().top;
    const winH = window.innerHeight;

    /* Parallax only while section is in view */
    if (sectionTop > winH || sectionTop < -section.offsetHeight) return;

    const progress = -sectionTop / (section.offsetHeight - winH);
    const p = Math.max(0, Math.min(1, progress));

    /* Mountain layers at different speeds */
    const speeds = [8, 18, 30];
    ranges.forEach((r, i) => {
      r.style.transform = `translateY(${p * speeds[i]}px)`;
    });

    /* Clouds drift slightly faster when scrolled */
    clouds.forEach((c, i) => {
      c.style.transform = `translateY(${p * (i * 5 + 4)}px)`;
    });

    /* Scroll-driven car: moves across the road as the section scrolls */
    if (car) {
      const carX = 5 + p * 80;            /* 5% → 85% of road width */
      car.style.left = carX + '%';

      /* Flip car to face left when going past midpoint (optional: leave facing right) */
      if (carX > 80) {
        car.style.transform = 'scaleX(-1)';
        car.querySelector('.car-exhaust').style.left = 'auto';
        car.querySelector('.car-exhaust').style.right = '-8px';
      } else {
        car.style.transform = 'scaleX(1)';
        car.querySelector('.car-exhaust').style.left = '-8px';
        car.querySelector('.car-exhaust').style.right = 'auto';
      }
    }

    /* Reveal stops progressively as car passes their positions */
    const stopPositions = [0, 0.12, 0.24, 0.40, 0.56, 0.72, 0.90];
    stops.forEach((stop, i) => {
      if (p >= stopPositions[i] - 0.04) {
        stop.classList.add('visible');
      }
    });

    /* Draw connector lines */
    connectors.forEach((conn, i) => {
      if (p >= stopPositions[i] + 0.05) {
        conn.parentElement.parentElement.classList.add('line-drawn');
      }
    });

    /* Activate current stop (highlight the closest one) */
    let activeIdx = 0;
    stopPositions.forEach((pos, i) => { if (p >= pos) activeIdx = i; });
    stops.forEach((s, i) => s.classList.toggle('active', i === activeIdx));
  }

  /* ── IntersectionObserver fallback: reveal all if JS scroll doesn't fire ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      /* Stagger each stop */
      stops.forEach((stop, i) => {
        setTimeout(() => stop.classList.add('visible'), i * 180);
      });
      setTimeout(() => {
        connectors.forEach((c, i) => {
          setTimeout(() => c.parentElement.parentElement.classList.add('line-drawn'), i * 300);
        });
      }, 400);
    });
  }, { threshold: 0.1 });
  revealObserver.observe(section);

  /* ── Ember random directions ── */
  document.querySelectorAll('.scene-ember').forEach(ember => {
    const x = (Math.random() - 0.5) * 16;
    ember.style.setProperty('--ex', x + 'px');
  });

  /* ── Stop card click: mark active ── */
  stops.forEach((stop, i) => {
    stop.addEventListener('click', () => {
      stops.forEach(s => s.classList.remove('active'));
      stop.classList.add('active');
    });
  });

  /* ── Wheel spin animation on road scroll ── */
  const wheels = document.querySelectorAll('.itin-car circle[r="4"]');
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const delta = Math.abs(window.scrollY - lastScrollY);
    lastScrollY = window.scrollY;
    wheels.forEach(w => {
      w.style.transition = 'none';
      const current = parseFloat(w.dataset.rot || 0);
      const next = current + delta * 0.8;
      w.dataset.rot = next;
      w.setAttribute('transform', `rotate(${next}, ${w.getAttribute('cx')}, ${w.getAttribute('cy')})`);
    });
  }, { passive: true });

  /* ── Run once on load in case section is already in view ── */
  onScroll();

})();
