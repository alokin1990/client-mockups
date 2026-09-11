(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('[data-menu]');

  const closeMenu = () => {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menu.classList.toggle('is-open', !open);
      document.body.classList.toggle('menu-open', !open);
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
        menuButton.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (menu.classList.contains('is-open') && !menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1080) closeMenu();
    });
  }

  const video = document.querySelector('#hero-video');
  const videoButton = document.querySelector('#video-toggle');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const updateVideoButton = () => {
    if (!video || !videoButton) return;
    const paused = video.paused;
    videoButton.setAttribute('aria-pressed', String(paused));
    videoButton.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
    videoButton.querySelector('.video-toggle-icon').textContent = paused ? '▶' : 'Ⅱ';
    videoButton.querySelector('.video-toggle-text').textContent = paused ? 'Play video' : 'Pause video';
  };

  if (video && videoButton && !reduceMotion.matches) {
    videoButton.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
      updateVideoButton();
    });
    video.addEventListener('play', updateVideoButton);
    video.addEventListener('pause', updateVideoButton);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !video.paused) video.pause();
      if (entry.isIntersecting && videoButton.getAttribute('aria-pressed') !== 'true') video.play().catch(() => {});
    }, { threshold: 0.1 });
    observer.observe(video);
    video.play().catch(updateVideoButton);
    updateVideoButton();
  } else if (video) {
    video.pause();
  }
})();
