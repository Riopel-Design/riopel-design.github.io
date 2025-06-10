document.addEventListener('DOMContentLoaded', () => {
  // Load nav
  fetch('/components/nav.html')
    .then(response => response.text())
    .then(data => {
      const navTarget = document.getElementById('nav-placeholder');
      navTarget.innerHTML = data;

      // 🔁 Wait for nav to be in DOM before running logic
      requestAnimationFrame(() => {
        // Highlight active nav link
        const path = window.location.pathname.split('/').pop().split('.html')[0] || 'index';
        const links = navTarget.querySelectorAll('a');
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href && href.includes(`${path}.html`)) {
            link.classList.add('text-blue-700', 'font-semibold');
          }
        });

        // Toggle mobile menu
        const toggle = document.getElementById('navToggle');
        const menu = document.getElementById('mobileMenu');
        if (toggle && menu) {
          toggle.addEventListener('click', () => {
            menu.classList.toggle('hidden');
          });
        }
      });
    });

  // Load hero if placeholder exists
  const heroTarget = document.getElementById('hero-placeholder');
  if (heroTarget) {
    fetch('/components/hero.html')
      .then(response => response.text())
      .then(data => {
        heroTarget.innerHTML = data;
      });
  }
});
