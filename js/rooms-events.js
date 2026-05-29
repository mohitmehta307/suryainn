/* ══════════════════════════════════════════
   ROOMS — tab switch + photo carousels
   EVENTS — tab switch + masonry lightbox
   ══════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── ROOM TABS ── */
  const roomTabs = document.querySelectorAll('.room-tab');
  const roomCats = document.querySelectorAll('.room-category');

  roomTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;
      roomTabs.forEach(t => t.classList.remove('active'));
      roomCats.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('cat-' + cat).classList.add('active');
      // re-init carousel dots for newly visible carousel
      initCarousel('carousel-' + cat);
    });
  });

  /* ── EVENT TABS ── */
  const eventTabs = document.querySelectorAll('.event-tab');
  const eventCats = document.querySelectorAll('.event-category');

  eventTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.evcat;
      eventTabs.forEach(t => t.classList.remove('active'));
      eventCats.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('evcat-' + cat).classList.add('active');
    });
  });

  /* ── CAROUSELS ── */
  const carousels = {};

  function initCarousel(id) {
    const wrap = document.getElementById(id);
    if (!wrap || carousels[id]) return;

    const track  = wrap.querySelector('.rpc-track');
    const slides = wrap.querySelectorAll('.rpc-slide');
    const dotsWrap = wrap.querySelector('.rpc-dots');
    const prev = wrap.querySelector('.rpc-prev');
    const next = wrap.querySelector('.rpc-next');
    if (!slides.length) return;

    let current = 0;
    let autoTimer;

    // Build dots
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'rpc-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    });

    function goTo(idx) {
      current = (idx + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dotsWrap.querySelectorAll('.rpc-dot').forEach((d, i) =>
        d.classList.toggle('active', i === current));
      resetAuto();
    }

    function resetAuto() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => goTo(current + 1), 4000);
    }

    prev.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));

    // Touch / swipe
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(current + (diff > 0 ? 1 : -1));
    });

    resetAuto();
    carousels[id] = true;
  }

  // Init all carousels on page load
  ['panoramic', 'hill', 'deluxe', 'cottage'].forEach(id => initCarousel('carousel-' + id));

  /* ── MASONRY LIGHTBOX ── */
  const lbStyle = document.createElement('style');
  lbStyle.textContent = `
    .em-lightbox { position:fixed;inset:0;z-index:9999;background:rgba(5,12,8,0.96);
      display:flex;align-items:center;justify-content:center;
      animation:lbIn 0.25s ease; cursor:zoom-out; }
    @keyframes lbIn { from{opacity:0} to{opacity:1} }
    .em-lightbox img { max-width:92vw;max-height:88vh;object-fit:contain;border-radius:10px;
      box-shadow:0 24px 80px rgba(0,0,0,0.8);cursor:default;
      animation:lbScale 0.3s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes lbScale { from{transform:scale(0.85);opacity:0} to{transform:scale(1);opacity:1} }
    .em-lb-prev, .em-lb-next { position:absolute;top:50%;transform:translateY(-50%);
      width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.3);
      background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
      color:#fff;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;
      transition:background 0.2s; }
    .em-lb-prev:hover,.em-lb-next:hover { background:rgba(255,255,255,0.25); }
    .em-lb-prev { left:1.5rem; } .em-lb-next { right:1.5rem; }
    .em-lb-close { position:absolute;top:1.2rem;right:1.5rem;color:rgba(255,255,255,0.7);
      font-size:1.8rem;background:none;border:none;cursor:pointer;transition:color 0.2s; }
    .em-lb-close:hover { color:#fff; }
    .em-lb-counter { position:absolute;bottom:1.5rem;left:50%;transform:translateX(-50%);
      color:rgba(255,255,255,0.5);font-size:0.8rem;letter-spacing:0.1em; }
  `;
  document.head.appendChild(lbStyle);

  function openMasonryLightbox(items, startIdx) {
    let idx = startIdx;
    const overlay = document.createElement('div');
    overlay.className = 'em-lightbox';

    const img = document.createElement('img');
    img.src = items[idx].querySelector('img').src;
    img.alt = items[idx].querySelector('img').alt;

    const btnPrev  = document.createElement('button');
    btnPrev.type = 'button'; btnPrev.className = 'em-lb-prev';
    btnPrev.setAttribute('aria-label','Previous');
    btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';

    const btnNext  = document.createElement('button');
    btnNext.type = 'button'; btnNext.className = 'em-lb-next';
    btnNext.setAttribute('aria-label','Next');
    btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';

    const btnClose = document.createElement('button');
    btnClose.type = 'button'; btnClose.className = 'em-lb-close';
    btnClose.setAttribute('aria-label','Close');
    btnClose.innerHTML = '&times;';

    const counter = document.createElement('div');
    counter.className = 'em-lb-counter';
    counter.textContent = (idx + 1) + ' / ' + items.length;

    function update() {
      img.style.animation = 'none';
      requestAnimationFrame(() => { img.style.animation = ''; });
      img.src = items[idx].querySelector('img').src;
      img.alt = items[idx].querySelector('img').alt;
      counter.textContent = (idx + 1) + ' / ' + items.length;
    }

    btnPrev.addEventListener('click', e => { e.stopPropagation(); idx = (idx - 1 + items.length) % items.length; update(); });
    btnNext.addEventListener('click', e => { e.stopPropagation(); idx = (idx + 1) % items.length; update(); });
    btnClose.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', () => overlay.remove());
    img.addEventListener('click', e => e.stopPropagation());

    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape')      { overlay.remove(); document.removeEventListener('keydown', handler); }
      if (e.key === 'ArrowLeft')   { idx = (idx - 1 + items.length) % items.length; update(); }
      if (e.key === 'ArrowRight')  { idx = (idx + 1) % items.length; update(); }
    });

    overlay.append(img, btnPrev, btnNext, btnClose, counter);
    document.body.appendChild(overlay);
  }

  // Wire all masonry grids
  document.querySelectorAll('.event-masonry').forEach(grid => {
    const items = Array.from(grid.querySelectorAll('.em-item'));
    items.forEach((item, i) => {
      item.addEventListener('click', () => openMasonryLightbox(items, i));
    });
  });

})();
