document.addEventListener('DOMContentLoaded', () => {
    // Load nav
    fetch('/components/nav.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('nav-placeholder').innerHTML = data;
  
        // Highlight active nav link
        const path = window.location.pathname.split('/').pop().split('.html')[0] || 'index';
        const links = document.querySelectorAll('.nav-links a');
        links.forEach(link => {
          const page = link.getAttribute('data-page') || 'index';
          if (path === page) {
            link.classList.add('active');
          }
        });
  
        // Mobile toggle
        const toggle = document.getElementById('navToggle');
        const linksContainer = document.getElementById('navLinks');
        if (toggle && linksContainer) {
          toggle.addEventListener('click', () => {
            linksContainer.classList.toggle('open');
          });
        }
      });
  
    // Load hero
    fetch('/components/hero.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('hero-placeholder').innerHTML = data;
      });
  });
  