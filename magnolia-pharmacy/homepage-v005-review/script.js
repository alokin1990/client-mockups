(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('[data-menu]');

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('is-open', !open);
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        menuButton.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        menuButton.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        menuButton.focus();
      }
    });
  }

  const hero = document.querySelector('[data-viewport-hero]');
  const chrome = [...document.querySelectorAll('[data-viewport-chrome]')];
  const desktopTail = window.matchMedia('(min-width: 901px)');
  const densities = ['comfortable', 'compact', 'tight'];

  const measureHero = () => {
    if (!hero) return;
    const tail = desktopTail.matches ? document.querySelector('[data-viewport-tail="desktop"]') : null;
    const offset = chrome.reduce((total, item) => total + item.getBoundingClientRect().height, 0);
    const tailHeight = tail ? tail.getBoundingClientRect().height : 0;
    hero.style.setProperty('--first-screen-offset', `${offset}px`);
    hero.style.setProperty('--first-screen-tail-size', `${tailHeight}px`);
    const available = Math.max(0, window.innerHeight - offset - tailHeight);
    let fitted = false;
    for (const density of densities) {
      hero.setAttribute('data-hero-density', density);
      fitted = hero.getBoundingClientRect().height <= available + 1 && hero.scrollHeight <= hero.clientHeight + 1;
      if (fitted) break;
    }
    hero.setAttribute('data-first-screen-fit', String(fitted));
    hero.setAttribute('data-first-screen-ready', 'true');
  };

  let frame = 0;
  const scheduleHeroMeasure = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(measureHero);
  };
  scheduleHeroMeasure();
  addEventListener('resize', scheduleHeroMeasure, {passive: true});
  addEventListener('orientationchange', scheduleHeroMeasure, {passive: true});
  document.fonts?.ready.then(scheduleHeroMeasure);

  const mobileCta = document.querySelector('[data-mobile-scroll-cta]');
  const heroActions = document.querySelector('[data-viewport-hero] .button-row');
  const finalCta = document.querySelector('.final-cta');
  const mobileViewport = window.matchMedia('(max-width: 900px)');
  const visible = (element) => {
    if (!element) return false;
    const box = element.getBoundingClientRect();
    return box.bottom > 0 && box.top < window.innerHeight;
  };
  const updateMobileCta = () => {
    if (!mobileCta || !heroActions) return;
    const show = mobileViewport.matches && window.scrollY > 0 && !visible(heroActions) && !visible(finalCta);
    mobileCta.classList.toggle('is-visible', show);
    mobileCta.toggleAttribute('inert', !show);
    mobileCta.setAttribute('aria-hidden', String(!show));
  };
  addEventListener('scroll', updateMobileCta, {passive: true});
  addEventListener('resize', updateMobileCta, {passive: true});
  updateMobileCta();
})();
