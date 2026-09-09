(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#primary-menu');
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('is-open', !open);
    });
  }

  const measureHero = () => {
    const hero = document.querySelector('[data-viewport-hero]');
    if (!hero) return;
    const top = hero.getBoundingClientRect().top + window.scrollY;
    document.documentElement.style.setProperty('--first-screen-offset', `${Math.max(0, top)}px`);
    hero.setAttribute('data-hero-density', 'comfortable');
    hero.setAttribute('data-first-screen-fit', String(hero.getBoundingClientRect().height <= window.innerHeight - top + 1));
    hero.setAttribute('data-first-screen-ready', 'true');
  };
  window.addEventListener('resize', measureHero, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', measureHero, { once: true });
  else measureHero();
  document.fonts?.ready.then(measureHero);
})();
