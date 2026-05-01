/* ============================================================
   GRAM-BONDHON — MAIN JAVASCRIPT
   ============================================================ */

'use strict';

/* ------ Hero Slider ------ */
(function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const dotsContainer = document.getElementById('heroDots');
  let current = 0;
  let timer;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Slide ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  function goTo(index) {
    slides[current].classList.remove('active');
    dotsContainer.children[current].classList.remove('active');
    current = index;
    slides[current].classList.add('active');
    dotsContainer.children[current].classList.add('active');
  }

  function next() {
    goTo((current + 1) % slides.length);
  }

  function startTimer() {
    timer = setInterval(next, 5000);
  }

  startTimer();

  // Pause on hover
  const hero = document.querySelector('.hero');
  hero.addEventListener('mouseenter', () => clearInterval(timer));
  hero.addEventListener('mouseleave', startTimer);
})();

/* ------ Navbar scroll effect ------ */
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const scrollThreshold = 60;

  function onScroll() {
    if (window.scrollY > scrollThreshold) {
      navbar.style.background = 'rgba(200, 221, 216, 0.97)';
      navbar.style.boxShadow = '0 2px 12px rgba(0,0,0,.12)';
    } else {
      navbar.style.background = '#c8ddd8';
      navbar.style.boxShadow = 'none';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ------ Active nav link on scroll ------ */
(function initActiveNav() {
  const links = document.querySelectorAll('.nav-link');
  const sections = ['hero', 'marketplace', 'how', 'projects', 'about'];

  function updateActive() {
    let found = 'hero';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (window.scrollY >= el.offsetTop - 120) found = id;
    });

    links.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === found);
    });
  }

  window.addEventListener('scroll', updateActive, { passive: true });
})();

/* ------ Mobile drawer ------ */
const drawer = document.getElementById('mobileDrawer');
const overlay = document.getElementById('drawerOverlay');
const hamburger = document.getElementById('hamburger');
const drawerClose = document.getElementById('drawerClose');

function openDrawer() {
  drawer.classList.add('open');
  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  drawer.classList.remove('open');
  overlay.classList.remove('visible');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
overlay.addEventListener('click', closeDrawer);

// Close drawer on drawer link click
document.querySelectorAll('.drawer-link').forEach(link => {
  link.addEventListener('click', closeDrawer);
});

/* ------ Modals ------ */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function switchModal(closeId, openId) {
  closeModal(closeId);
  setTimeout(() => openModal(openId), 50);
}

// Close modal on backdrop click
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  backdrop.addEventListener('click', function(e) {
    if (e.target === this) closeModal(this.id);
  });
});

// ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => closeModal(m.id));
    closeDrawer();
  }
});

// Make modal functions global
window.openModal = openModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.closeDrawer = closeDrawer;

/* ------ Role toggle in signup ------ */
function setRole(role) {
  document.getElementById('roleInvestor').classList.toggle('active', role === 'investor');
  document.getElementById('roleFarmer').classList.toggle('active', role === 'farmer');
}
window.setRole = setRole;

/* ------ Invest Now buttons ------ */
document.querySelectorAll('.btn-invest').forEach(btn => {
  btn.addEventListener('click', function() {
    const card = this.closest('.project-card');
    const title = card.querySelector('h3').textContent;
    openModal('signupModal');
    // Optionally pre-fill project name — extend as needed
    console.log('Invest clicked:', title);
  });
});

/* ------ View All Projects button ------ */
const viewAllBtn = document.querySelector('.btn-outline-green');
if (viewAllBtn) {
  viewAllBtn.addEventListener('click', () => {
    document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ------ View Openings button ------ */
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.trim() === 'View Openings') {
    btn.addEventListener('click', () => {
      alert('Coming soon! We will post openings here.');
    });
  }
});

/* ------ Scroll-reveal (Intersection Observer) ------ */
(function initFadeIn() {
  const cards = [
    ...document.querySelectorAll('.step-card'),
    ...document.querySelectorAll('.project-card'),
    ...document.querySelectorAll('.testimonial-card'),
    ...document.querySelectorAll('.about-card'),
    ...document.querySelectorAll('.halal-stat'),
    document.querySelector('.halal-text'),
    document.querySelector('.halal-img'),
    document.querySelector('.about-text'),
    document.querySelector('.about-img'),
  ].filter(Boolean);

  cards.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  cards.forEach(el => observer.observe(el));
})();

/* ------ Funded progress bars (animated) ------ */
(function initProgressBars() {
  document.querySelectorAll('.funded-badge').forEach(badge => {
    const percent = parseInt(badge.textContent);
    if (isNaN(percent)) return;

    const card = badge.closest('.project-card');
    const footer = card.querySelector('.project-footer');

    // Insert progress bar before footer
    const wrap = document.createElement('div');
    wrap.className = 'progress-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    wrap.appendChild(bar);
    footer.before(wrap);

    // Animate when visible
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          bar.style.width = percent + '%';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(card);
  });
})();

/* ------ Smooth scroll for ALL anchor links ------ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

console.log('%cGram-Bondhon loaded ✓', 'color:#2d7860;font-weight:bold;font-size:14px');
