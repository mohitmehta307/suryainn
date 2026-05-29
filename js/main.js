/* ─── NAVBAR ─── */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  toggleBackToTop();
});

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
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ─── ACTIVE NAV ─── */
const sections = document.querySelectorAll('section[id]');
const navLinkItems = document.querySelectorAll('.nav-links a:not(.btn-nav)');

const highlightNav = () => {
  const scrollPos = window.scrollY + 120;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollPos >= top && scrollPos < top + height) {
      navLinkItems.forEach(a => {
        a.style.color = '';
        if (a.getAttribute('href') === '#' + id) {
          a.style.color = 'var(--gold-light)';
        }
      });
    }
  });
};
window.addEventListener('scroll', highlightNav);

/* ─── AOS (scroll reveal) ─── */
const aosElements = document.querySelectorAll('[data-aos]');

const aosObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('aos-animate');
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

aosElements.forEach(el => aosObserver.observe(el));

/* ─── BACK TO TOP ─── */
const backToTop = document.getElementById('backToTop');

function toggleBackToTop() {
  if (window.scrollY > 400) {
    backToTop.classList.add('visible');
  } else {
    backToTop.classList.remove('visible');
  }
}

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ─── CONTACT FORM ─── */
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = contactForm.querySelector('.btn-submit');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Enquiry';
    contactForm.reset();
    showToast();
  }, 1400);
});

function showToast() {
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ─── HERO PARALLAX ─── */
const heroSvg = document.querySelector('.hero-svg');
window.addEventListener('scroll', () => {
  if (heroSvg) {
    const offset = window.scrollY * 0.25;
    heroSvg.style.transform = `translateY(${offset}px)`;
  }
});

/* ─── GALLERY LIGHTBOX (basic) ─── */
const galleryItems = document.querySelectorAll('.gallery-item');
galleryItems.forEach(item => {
  item.addEventListener('click', () => {
    const bg = item.querySelector('.img-placeholder');
    if (!bg) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed;inset:0;z-index:9999;background:rgba(10,20,15,0.95);
      display:flex;align-items:center;justify-content:center;cursor:zoom-out;
      animation:fadeIn 0.25s ease;
    `;
    const style = document.createElement('style');
    style.textContent = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(style);
    const box = document.createElement('div');
    box.style.cssText = `
      width:min(90vw,800px);height:min(80vh,600px);border-radius:16px;overflow:hidden;
      box-shadow:0 24px 80px rgba(0,0,0,0.7);
    `;
    const clone = bg.cloneNode(true);
    clone.style.cssText = 'width:100%;height:100%;transform:none;';
    box.appendChild(clone);
    overlay.appendChild(box);
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  });
});

/* ─── STARS TWINKLE ─── */
const stars = document.querySelectorAll('.stars circle');
stars.forEach((star, i) => {
  star.style.animation = `twinkle ${1.5 + (i % 4) * 0.6}s ${i * 0.3}s infinite alternate`;
});
const twinkleStyle = document.createElement('style');
twinkleStyle.textContent = `
  @keyframes twinkle {
    from { opacity: 0.3; r: 1; }
    to   { opacity: 1; r: 2.5; }
  }
`;
document.head.appendChild(twinkleStyle);

/* ─── SET MIN DATES ON FORM ─── */
const checkinInput = document.getElementById('checkin');
const checkoutInput = document.getElementById('checkout');
if (checkinInput) {
  const today = new Date().toISOString().split('T')[0];
  checkinInput.setAttribute('min', today);
  checkoutInput.setAttribute('min', today);
  checkinInput.addEventListener('change', () => {
    checkoutInput.setAttribute('min', checkinInput.value);
    if (checkoutInput.value && checkoutInput.value < checkinInput.value) {
      checkoutInput.value = '';
    }
  });
}
