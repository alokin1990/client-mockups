const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#main-menu');
menuToggle?.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menu?.classList.toggle('is-open', open);
});

document.querySelectorAll('.nav-dropdown > button').forEach((button) => {
  button.addEventListener('click', () => {
    const parent = button.closest('.nav-dropdown');
    const open = button.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('.nav-dropdown > button').forEach((other) => {
      other.setAttribute('aria-expanded', 'false');
      other.closest('.nav-dropdown')?.classList.remove('is-open');
    });
    button.setAttribute('aria-expanded', String(open));
    parent?.classList.toggle('is-open', open);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  menuToggle?.setAttribute('aria-expanded', 'false');
  menu?.classList.remove('is-open');
  document.querySelectorAll('.nav-dropdown > button').forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
    button.closest('.nav-dropdown')?.classList.remove('is-open');
  });
});
