document.addEventListener('DOMContentLoaded', () => {
    // Load nav component
    fetch('components/nav.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('nav-placeholder').innerHTML = data;
  
        // Highlight active link
        const path = window.location.pathname.split('/').pop().split('.html')[0] || 'index';
        const links = document.querySelectorAll('.nav-links a');
  
        links.forEach(link => {
          const page = link.getAttribute('data-page') || 'index';
          if (path === page) {
            link.classList.add('active');
          }
        });
  
        // Add toggle functionality after nav is loaded
        const toggle = document.getElementById('navToggle');
        const linksContainer = document.getElementById('navLinks');
  
        toggle.addEventListener('click', () => {
          linksContainer.classList.toggle('open');
        });
      });
  });
  