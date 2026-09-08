(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-menu');
  const menuClose = document.querySelector('.menu-close');

  const closeMenu = () => {
    if (!menu || !menuButton) return;
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  const openMenu = () => {
    if (!menu || !menuButton) return;
    menu.classList.add('is-open');
    menuButton.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    menuClose?.focus();
  };

  menuButton?.addEventListener('click', () => {
    if (menu?.classList.contains('is-open')) closeMenu();
    else openMenu();
  });
  menuClose?.addEventListener('click', () => {
    closeMenu();
    menuButton?.focus();
  });
  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  const modal = document.querySelector('[data-mobile-cta-modal]');
  const openModal = document.querySelector('[data-open-cta-modal]');
  const closeModal = document.querySelector('[data-close-cta-modal]');

  const showModal = (event) => {
    event?.preventDefault();
    if (!(modal instanceof HTMLDialogElement)) return;
    modal.showModal();
    closeModal?.focus();
  };

  const hideModal = () => {
    if (!(modal instanceof HTMLDialogElement) || !modal.open) return;
    modal.close();
    openModal?.focus();
  };

  openModal?.addEventListener('click', showModal);
  closeModal?.addEventListener('click', hideModal);
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) hideModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (modal instanceof HTMLDialogElement && modal.open) hideModal();
    else if (menu?.classList.contains('is-open')) {
      closeMenu();
      menuButton?.focus();
    }
  });
})();
