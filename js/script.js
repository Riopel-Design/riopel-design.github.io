// Mobile toggle button
document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
  
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });
  });
  