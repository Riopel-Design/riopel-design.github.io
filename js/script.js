document.addEventListener('DOMContentLoaded', () => {
  // Load nav
  fetch('/components/nav.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('nav-placeholder').innerHTML = data;

      // Highlight active nav link
      const path = window.location.pathname.split('/').pop().split('.html')[0] || 'index';
      const links = document.querySelectorAll('nav a');
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(`${path}.html`)) {
          link.classList.add('text-blue-700', 'font-semibold'); // Add visual highlight via Tailwind
        }
      });

      // Mobile toggle
      const toggle = document.getElementById('navToggle');
      const menu = document.getElementById('mobileMenu');
      if (toggle && menu) {
        toggle.addEventListener('click', () => {
          menu.classList.toggle('hidden');
        });
      }
    });

  // Load hero only if the placeholder exists
  const heroTarget = document.getElementById('hero-placeholder');
  if (heroTarget) {
    fetch('/components/hero.html')
      .then(response => response.text())
      .then(data => {
        heroTarget.innerHTML = data;
      });
  }
});
