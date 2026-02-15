document.addEventListener('DOMContentLoaded', () => {
  injectComponent('nav-placeholder', '/components/nav.html', () => {
    highlightActiveNavLink();
    enableMobileToggle();
  });
  injectComponent('hero-placeholder', '/components/hero.html', () => {
    initScrollReveal();
  });
  initScrollReveal();
});

function injectComponent(targetId, path, callback) {
  const target = document.getElementById(targetId);
  if (!target) return;

  fetch(path)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
      return res.text();
    })
    .then(html => {
      target.innerHTML = html;
      if (callback) requestAnimationFrame(callback);
    })
    .catch(err => {
      console.warn(`[inject] ${err.message}`);
      target.style.display = 'none';
    });
}

function highlightActiveNavLink() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    // Highlight "Work" for both /work.html and /case-studies/*
    if (href === '/work.html' && (path.includes('/work') || path.includes('/case-studies/'))) {
      link.classList.add('active');
    } else if (path === href || path === href.replace('.html', '')) {
      link.classList.add('active');
    } else if (path === '/' && (href === '/' || href === '/index.html')) {
      link.classList.add('active');
    }
  });
}

function enableMobileToggle() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const opening = menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    toggle.setAttribute('aria-expanded', String(opening));

    const lines = toggle.querySelectorAll('line');
    if (lines.length === 2) {
      if (opening) {
        lines[0].setAttribute('y1', '12'); lines[0].setAttribute('y2', '12');
        lines[0].setAttribute('x1', '5');  lines[0].setAttribute('x2', '19');
        lines[0].style.transform = 'rotate(45deg)';
        lines[0].style.transformOrigin = 'center';
        lines[1].setAttribute('y1', '12'); lines[1].setAttribute('y2', '12');
        lines[1].setAttribute('x1', '5');  lines[1].setAttribute('x2', '19');
        lines[1].style.transform = 'rotate(-45deg)';
        lines[1].style.transformOrigin = 'center';
      } else {
        lines[0].setAttribute('y1', '7');  lines[0].setAttribute('y2', '7');
        lines[0].setAttribute('x1', '4');  lines[0].setAttribute('x2', '20');
        lines[0].style.transform = 'none';
        lines[1].setAttribute('y1', '17'); lines[1].setAttribute('y2', '17');
        lines[1].setAttribute('x1', '4');  lines[1].setAttribute('x2', '20');
        lines[1].style.transform = 'none';
      }
    }
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-group').forEach(el => {
    if (!el.classList.contains('visible')) observer.observe(el);
  });
}