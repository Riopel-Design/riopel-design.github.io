document.addEventListener('DOMContentLoaded', () => {
    // Load nav component
    fetch('components/nav.html')
      .then(response => response.text())
      .then(data => {
        // Inject the nav into the page
        document.getElementById('nav-placeholder').innerHTML = data;
  
        // ✅ NOW we can select and use nav elements
        const path = window.location.pathname.split('/').pop().split('.html')[0] || 'index';
        const links = document.querySelectorAll('.nav-links a');
  
        links.forEach(link => {
          const page = link.getAttribute('data-page') || 'index';
          if (path === page) {
            link.classList.add('active');
          }
        });
  
        // ✅ Add toggle functionality *after* nav is in DOM
        const toggle = document.getElementById('navToggle');
        const linksContainer = document.getElementById('navLinks');
  
        if (toggle && linksContainer) {
          toggle.addEventListener('click', () => {
            linksContainer.classList.toggle('open');
          });
        }
      })
      .catch(err => {
        console.error('Error loading navigation:', err);
      });
  });
  