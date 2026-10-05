const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const header = document.querySelector('.site-header');
const mobileNav = window.matchMedia('(max-width: 900px)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function headerOffset() {
  return header ? header.getBoundingClientRect().height : 0;
}

function lockScroll() {
  document.documentElement.classList.add('nav-open');
  document.body.classList.add('nav-open');
}

function unlockScroll() {
  document.documentElement.classList.remove('nav-open');
  document.body.classList.remove('nav-open');
}

function setMenuOpen(open) {
  const wasOpen = nav.classList.contains('open');
  nav.classList.toggle('open', open);
  nav.toggleAttribute('inert', mobileNav.matches && !open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open && !wasOpen) lockScroll();
  if (!open && wasOpen) unlockScroll();
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animatedScrollTo(targetY) {
  const startY = window.scrollY;
  const diff = targetY - startY;
  if (Math.abs(diff) < 2) return;

  if (reduceMotion.matches) {
    window.scrollTo(0, targetY);
    return;
  }

  const duration = Math.min(1100, Math.max(620, Math.abs(diff) * 0.42));
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, startY + diff * easeInOutCubic(t));
    if (t < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset();
  animatedScrollTo(Math.max(0, top));
}

if (toggle && nav) {
  nav.toggleAttribute('inert', mobileNav.matches);

  toggle.addEventListener('click', () => {
    setMenuOpen(!nav.classList.contains('open'));
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#') || !mobileNav.matches) return;

      event.preventDefault();
      link.blur();
      const id = href.slice(1);
      setMenuOpen(false);
      history.pushState(null, '', href);

      const delay = reduceMotion.matches ? 0 : 280;
      window.setTimeout(() => scrollToSection(id), delay);
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('click', event => {
    if (!mobileNav.matches || !nav.classList.contains('open')) return;
    if (event.target.closest('.site-nav, .nav-toggle')) return;
    setMenuOpen(false);
  });

  mobileNav.addEventListener('change', event => {
    if (!event.matches && nav.classList.contains('open')) {
      setMenuOpen(false);
    }
    nav.toggleAttribute('inert', event.matches && !nav.classList.contains('open'));
  });
}

document.getElementById('year').textContent = new Date().getFullYear();

const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(item => observer.observe(item));
} else {
  items.forEach(item => item.classList.add('visible'));
}
