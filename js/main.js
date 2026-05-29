/* ─── NAVBAR SCROLL ─── */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
  toggleBackToTop();
}, { passive: true });

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

/* ─── SMOOTH SCROLL ─── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
  });
});

/* ─── ACTIVE NAV LINK ─── */
const sections = document.querySelectorAll('section[id]');
const navLinkItems = document.querySelectorAll('.nav-links a:not(.btn-nav)');
window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY + 120;
  sections.forEach(section => {
    if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
      navLinkItems.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + section.id ? 'var(--gold-light)' : '';
      });
    }
  });
}, { passive: true });

/* ─── AOS SCROLL REVEAL ─── */
const aosObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('aos-animate');
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('[data-aos]').forEach(el => aosObserver.observe(el));

/* ─── BACK TO TOP ─── */
const backToTop = document.getElementById('backToTop');
function toggleBackToTop() {
  backToTop.classList.toggle('visible', window.scrollY > 400);
}
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ─── HIGHLIGHTS COUNT-UP ─── */
const highlights = document.querySelector('.highlights');
let counted = false;
const counters = [
  { el: highlights.querySelectorAll('.h-num')[0], target: 12, suffix: '+', decimals: 0 },
  { el: highlights.querySelectorAll('.h-num')[1], target: 2,  suffix: ' km', decimals: 0 },
  { el: highlights.querySelectorAll('.h-num')[2], target: 4.8,suffix: '', decimals: 1 },
  { el: highlights.querySelectorAll('.h-num')[3], target: 360,suffix: '°', decimals: 0 },
];
const highlightObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !counted) {
      counted = true;
      highlights.classList.add('in-view');
      counters.forEach(({ el, target, suffix, decimals }, i) => {
        if (!el) return;
        const duration = 1400;
        const startTime = performance.now() + i * 120;
        function tick(now) {
          const elapsed = Math.max(0, now - startTime);
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          const val = (target * ease).toFixed(decimals);
          el.textContent = val + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }
  });
}, { threshold: 0.5 });
highlightObserver.observe(highlights);

/* ─── STAGGERED OTHER-EVENTS ENTRANCE ─── */
const otherItems = document.querySelectorAll('.other-event-item');
const otherObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      otherItems.forEach((item, i) => {
        setTimeout(() => item.classList.add('visible'), i * 80);
      });
      otherObserver.disconnect();
    }
  });
}, { threshold: 0.2 });
if (otherItems.length) otherObserver.observe(otherItems[0].closest('.other-events'));

/* ─── MOUSE GLOW ON CARDS ─── */
document.querySelectorAll('.room-card, .exp-card, .testi-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
  });
});

/* ─── HERO PARALLAX ─── */
const heroPhoto = document.querySelector('.hero-photo');
window.addEventListener('scroll', () => {
  if (heroPhoto && window.scrollY < window.innerHeight) {
    heroPhoto.style.transform = `scale(1.08) translateY(${window.scrollY * 0.15}px)`;
  }
}, { passive: true });

/* ─── GALLERY LIGHTBOX ─── */
const lightboxStyle = document.createElement('style');
lightboxStyle.textContent = `
  .lightbox-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(5,12,8,0.96);
    display: flex; align-items: center; justify-content: center;
    animation: lbFadeIn 0.25s ease;
    cursor: zoom-out;
  }
  @keyframes lbFadeIn { from { opacity:0 } to { opacity:1 } }
  .lightbox-img {
    max-width: 92vw; max-height: 90vh;
    border-radius: 12px; object-fit: contain;
    box-shadow: 0 24px 80px rgba(0,0,0,0.8);
    animation: lbScale 0.3s cubic-bezier(0.34,1.56,0.64,1);
    cursor: default;
  }
  @keyframes lbScale { from { transform:scale(0.85); opacity:0 } to { transform:scale(1); opacity:1 } }
  .lightbox-close {
    position: absolute; top: 1.5rem; right: 1.5rem;
    color: rgba(255,255,255,0.7); font-size: 1.8rem;
    background: none; border: none; cursor: pointer;
    transition: color 0.2s;
  }
  .lightbox-close:hover { color: #fff; }
`;
document.head.appendChild(lightboxStyle);

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (!img) return;
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    const photo = document.createElement('img');
    photo.className = 'lightbox-img';
    photo.src = img.src; photo.alt = img.alt;
    photo.addEventListener('click', e => e.stopPropagation());
    const close = document.createElement('button');
    close.className = 'lightbox-close'; close.innerHTML = '&times;';
    close.addEventListener('click', () => overlay.remove());
    overlay.appendChild(photo); overlay.appendChild(close);
    overlay.addEventListener('click', () => overlay.remove());
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); }
    });
    document.body.appendChild(overlay);
  });
});

/* ─── CONTACT FORM ─── */
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');
contactForm.addEventListener('submit', e => {
  e.preventDefault();
  const btn = contactForm.querySelector('.btn-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Enquiry';
    contactForm.reset();
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }, 1400);
});

/* ─── DATE VALIDATION ─── */
const checkinInput = document.getElementById('checkin');
const checkoutInput = document.getElementById('checkout');
if (checkinInput) {
  const today = new Date().toISOString().split('T')[0];
  checkinInput.min = today;
  checkoutInput.min = today;
  checkinInput.addEventListener('change', () => {
    checkoutInput.min = checkinInput.value;
    if (checkoutInput.value && checkoutInput.value < checkinInput.value) checkoutInput.value = '';
  });
}

/* ─── NAVBAR LINK RIPPLE ─── */
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position:absolute; border-radius:50%; transform:scale(0);
      background:rgba(201,168,76,0.35); pointer-events:none;
      width:60px; height:60px; margin-left:-30px; margin-top:-30px;
      animation:ripple 0.5s linear; left:${e.offsetX}px; top:${e.offsetY}px;
    `;
    this.style.position = 'relative'; this.style.overflow = 'hidden';
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });
});
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `@keyframes ripple { to { transform:scale(3); opacity:0; } }`;
document.head.appendChild(rippleStyle);

/* ─── SCROLL PROGRESS BAR ─── */
const progressBar = document.createElement('div');
progressBar.style.cssText = `
  position: fixed; top: 0; left: 0; height: 3px; width: 0%;
  background: linear-gradient(90deg, var(--earth), var(--gold), var(--earth-light));
  z-index: 9999; transition: width 0.1s linear;
  will-change: width;
`;
document.body.appendChild(progressBar);
window.addEventListener('scroll', () => {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (window.scrollY / docH * 100) + '%';
}, { passive: true });
