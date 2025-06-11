// script.js
document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  injectHero();
});

/** Load and inject the nav component */
function injectNav() {
  fetch('/components/nav.html')
    .then(res => res.text())
    .then(html => {
      const target = document.getElementById('nav-placeholder');
      target.innerHTML = html;

      requestAnimationFrame(() => {
        highlightActiveNavLink(target);
        enableMobileToggle();
      });
    });
}

/** Load and inject the hero component */
function injectHero() {
  const target = document.getElementById('hero-placeholder');
  if (!target) return;

  fetch('/components/hero.html')
    .then(res => res.text())
    .then(html => {
      target.innerHTML = html;

      requestAnimationFrame(() => {
        enableHeroSpotlight();
      });
    });
}

/** Highlight the current page in the nav */
function highlightActiveNavLink(navRoot) {
  const path = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
  navRoot.querySelectorAll('a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.includes(`${path}.html`)) {
      link.classList.add('text-blue-700', 'font-semibold');
    }
  });
}

/** Enable mobile menu toggle in nav */
function enableMobileToggle() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });
  }
}

/** Enable cursor-based spotlight in hero */
function enableHeroSpotlight() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    hero.style.setProperty('--mouse-x', `${x}%`);
    hero.style.setProperty('--mouse-y', `${y}%`);
  });

  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--mouse-x', '50%');
    hero.style.setProperty('--mouse-y', '50%');
  });
}
