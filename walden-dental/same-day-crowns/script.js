(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#main-menu');

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('is-open', !open);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) {
        menuButton.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
      }
    });
  }

  const dropdowns = [...document.querySelectorAll('.nav-dropdown')];
  const closeDropdowns = (except = null) => {
    dropdowns.forEach((dropdown) => {
      if (dropdown === except) return;
      dropdown.classList.remove('is-open');
      dropdown.querySelector(':scope > button')?.setAttribute('aria-expanded', 'false');
    });
  };

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector(':scope > button');
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !dropdown.classList.contains('is-open');
      closeDropdowns(dropdown);
      dropdown.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    });
  });

  document.addEventListener('click', () => closeDropdowns());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDropdowns();
  });

  document.querySelectorAll('.video-frame').forEach((frame) => {
    const button = frame.querySelector('.play-button');
    if (!button) return;

    button.addEventListener('click', () => {
      const provider = frame.dataset.videoProvider;
      const id = frame.dataset.videoId;
      const iframe = document.createElement('iframe');
      const source = provider === 'vimeo'
        ? `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0`
        : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;

      iframe.src = source;
      iframe.title = button.getAttribute('aria-label') || 'Video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.replaceChildren(iframe);
    }, { once: true });
  });
})();
