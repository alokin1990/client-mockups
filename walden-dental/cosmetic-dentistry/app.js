const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('[data-menu]');

function closeMenu() {
  if (!menuButton || !menu) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menu.dataset.open = 'false';
}

if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menu.dataset.open = String(!isOpen);
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
}

document.querySelectorAll('#before-after-cases .ba-item').forEach(card => {
  const toggle = card.querySelector('.ba-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const showBefore = card.dataset.view !== 'before';
    card.dataset.view = showBefore ? 'before' : 'after';
    card.dataset.interacted = 'true';
    toggle.setAttribute('aria-pressed', String(showBefore));
    toggle.setAttribute('aria-label', `Show ${showBefore ? 'after' : 'before'} photo for case ${card.dataset.case}`);
  });
});
