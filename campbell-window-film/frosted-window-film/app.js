const mobileMenu = document.querySelector('.mobile-nav');

if (mobileMenu) {
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.open = false;
    });
  });

  mobileMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      mobileMenu.open = false;
      mobileMenu.querySelector('summary')?.focus();
    }
  });
}
