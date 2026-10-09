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
      if (!mobileNav.matches) return;
      if (!href.startsWith('#')) {
        setMenuOpen(false);
        return;
      }

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

const marquee = document.querySelector('[data-marquee]');
const marqueeGroup = marquee && marquee.querySelector('.marquee-group');
const marqueeSpeed = 22;
let marqueeWidth = 0;

function resetMarquee() {
  marquee.classList.remove('is-running', 'is-animated');
  marquee.querySelectorAll('.marquee-group:not(:first-child)').forEach(node => node.remove());
  marqueeGroup.querySelectorAll('[data-clone]').forEach(node => node.remove());
}

function buildMarquee() {
  if (!marquee || !marqueeGroup) return;
  stopMarqueeCoast();
  marqueePointer = null;
  marqueeDrag = false;
  marquee.classList.remove('is-dragging');
  resetMarquee();
  if (reduceMotion.matches) {
    marqueeWidth = marquee.clientWidth;
    return;
  }

  const seeds = [...marqueeGroup.children];
  if (!seeds.length) return;

  marquee.classList.add('is-running');
  const viewport = marquee.clientWidth;
  let guard = 0;
  while (marqueeGroup.scrollWidth < viewport && guard < 8) {
    seeds.forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.dataset.clone = 'true';
      marqueeGroup.appendChild(clone);
    });
    guard += 1;
  }

  const copy = marqueeGroup.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  marquee.appendChild(copy);
  marquee.style.setProperty('--marquee-duration', `${marqueeGroup.scrollWidth / marqueeSpeed}s`);
  marquee.classList.add('is-animated');
  marqueeWidth = marquee.clientWidth;
}

let marqueePointer = null;
let marqueeDrag = false;
let marqueeCoast = 0;

function marqueeAnimations() {
  return [...marquee.querySelectorAll('.marquee-group')]
    .map(group => group.getAnimations().find(anim => anim.animationName === 'marquee-scroll'))
    .filter(Boolean);
}

function setMarqueeTime(time) {
  const anims = marqueeAnimations();
  const duration = anims[0] && anims[0].effect.getTiming().duration;
  if (!duration) return;
  const wrapped = ((time % duration) + duration) % duration;
  anims.forEach(anim => { anim.currentTime = wrapped; });
}

function playMarquee() {
  marqueeAnimations().forEach(anim => anim.play());
}

function stopMarqueeCoast() {
  marqueeCoast += 1;
}

function coastMarquee(velocity) {
  const token = ++marqueeCoast;
  const maxVelocity = 1.6;
  let speed = Math.max(-maxVelocity, Math.min(maxVelocity, velocity));
  if (Math.abs(speed) < 0.08) {
    playMarquee();
    return;
  }

  const width = marqueeGroup.getBoundingClientRect().width || 1;
  let last = performance.now();

  function frame(now) {
    if (token !== marqueeCoast) return;
    const anims = marqueeAnimations();
    const duration = anims[0] && anims[0].effect.getTiming().duration;
    if (!duration) return;

    const dt = Math.min(34, now - last);
    last = now;
    setMarqueeTime(anims[0].currentTime - (speed * dt / width) * duration);
    speed *= Math.pow(0.9, dt / 16);
    if (Math.abs(speed) > 0.045) requestAnimationFrame(frame);
    else playMarquee();
  }

  requestAnimationFrame(frame);
}

function enableMarqueeControl() {
  let originX = 0;
  let originY = 0;
  let originTime = 0;
  let samples = [];
  let wheelTimer = 0;

  function remember(x) {
    const now = performance.now();
    samples.push({ x, t: now });
    const cutoff = now - 90;
    while (samples.length > 2 && samples[0].t < cutoff) samples.shift();
  }

  function releaseVelocity() {
    if (samples.length < 2) return 0;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = last.t - first.t;
    if (dt < 16) return 0;
    return (last.x - first.x) / dt;
  }

  function endPointer(event, cancelled) {
    if (!marqueePointer || event.pointerId !== marqueePointer) return;
    const dragged = marqueeDrag;
    marqueePointer = null;
    marqueeDrag = false;
    marquee.classList.remove('is-dragging');
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    if (!dragged) {
      if (marqueeAnimations().some(anim => anim.playState === 'paused')) playMarquee();
      return;
    }
    if (cancelled) playMarquee();
    else coastMarquee(releaseVelocity());
  }

  function onPointerUp(event) { endPointer(event, false); }
  function onPointerCancel(event) { endPointer(event, true); }

  marquee.addEventListener('pointerdown', event => {
    if (event.button !== 0 || marqueePointer !== null) return;
    const anims = marqueeAnimations();
    if (!anims.length) return;
    marqueePointer = event.pointerId;
    marqueeDrag = false;
    originX = event.clientX;
    originY = event.clientY;
    originTime = anims[0].currentTime || 0;
    samples = [];
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  });

  marquee.addEventListener('pointermove', event => {
    if (event.pointerId !== marqueePointer) return;
    const dx = event.clientX - originX;
    const dy = event.clientY - originY;

    if (!marqueeDrag) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        marqueePointer = null;
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        return;
      }
      const anims = marqueeAnimations();
      if (!anims.length) return;
      stopMarqueeCoast();
      anims.forEach(anim => anim.pause());
      originX = event.clientX;
      originTime = anims[0].currentTime || 0;
      marqueeDrag = true;
      marquee.classList.add('is-dragging');
      try { marquee.setPointerCapture(event.pointerId); } catch (error) {}
    }

    const anims = marqueeAnimations();
    const duration = anims[0] && anims[0].effect.getTiming().duration;
    const width = marqueeGroup.getBoundingClientRect().width || 1;
    if (!duration) return;
    setMarqueeTime(originTime - ((event.clientX - originX) / width) * duration);
    remember(event.clientX);
  });

  marquee.addEventListener('wheel', event => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    const anims = marqueeAnimations();
    const duration = anims[0] && anims[0].effect.getTiming().duration;
    if (!duration || marqueeDrag) return;
    event.preventDefault();
    stopMarqueeCoast();
    anims.forEach(anim => anim.pause());
    const width = marqueeGroup.getBoundingClientRect().width || 1;
    setMarqueeTime((anims[0].currentTime || 0) + (event.deltaX / width) * duration);
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => {
      if (!marqueeDrag) playMarquee();
    }, 160);
  }, { passive: false });
}

if (marqueeGroup) {
  buildMarquee();
  enableMarqueeControl();
  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      // Mobile browsers fire resize when the address bar shows or hides.
      // That changes the height only, so the ticker should keep moving.
      if (marquee.clientWidth === marqueeWidth) return;
      buildMarquee();
    }, 150);
  });
  reduceMotion.addEventListener('change', buildMarquee);
}

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
