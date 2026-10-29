(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  const sticky = document.querySelector('.mobile-sticky-action');
  const heroActions = document.querySelector('#hero [data-element="hero-actions"]');
  const closingRequest = document.querySelector('#final-action [data-element="closing-actions"] .button-aqua');
  let stickyFrame = 0;

  function updateSticky() {
    if (!sticky) return;
    const heroRect = heroActions?.getBoundingClientRect();
    const closingRect = closingRequest?.getBoundingClientRect();
    const heroActionsVisible = !!heroRect && heroRect.bottom > 0 && heroRect.top < window.innerHeight;
    const closingRequestFullyVisible = !!closingRect && closingRect.top >= 0 && closingRect.bottom <= window.innerHeight;
    const closingRequestPassed = !!closingRect && closingRect.bottom < 0;
    const narrowNavigation = window.matchMedia('(max-width: 900px)').matches;
    const showSticky = narrowNavigation && !heroActionsVisible && !closingRequestFullyVisible && !closingRequestPassed && menu?.hidden !== false;
    if (!showSticky && sticky.classList.contains('is-visible') && document.activeElement === sticky) {
      const nextAction = menu?.hidden === false ? toggle : closingRequestFullyVisible ? closingRequest : heroActionsVisible ? heroActions?.querySelector('.button-aqua') : closingRequest;
      nextAction?.focus({ preventScroll: true });
    }
    sticky.classList.toggle('is-visible', showSticky);
  }

  function scheduleStickyUpdate() {
    if (stickyFrame) return;
    stickyFrame = requestAnimationFrame(() => {
      stickyFrame = 0;
      updateSticky();
    });
  }

  function closeMenu() {
    if (!toggle || !menu) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    updateSticky();
  }

  toggle?.addEventListener('click', () => {
    if (!menu) return;
    const opening = menu.hidden;
    menu.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
    toggle.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
    updateSticky();
  });

  menu?.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu && !menu.hidden) {
      closeMenu();
      toggle?.focus();
    }
  });

  window.addEventListener('scroll', scheduleStickyUpdate, { passive: true });
  window.addEventListener('resize', scheduleStickyUpdate, { passive: true });
  document.querySelectorAll('#faq details').forEach((details) => details.addEventListener('toggle', scheduleStickyUpdate));
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(scheduleStickyUpdate);
    [document.querySelector('#faq'), document.querySelector('#final-action')].filter(Boolean).forEach((section) => observer.observe(section));
  }
  updateSticky();

  document.querySelectorAll('button[data-video-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.videoId;
      const title = button.dataset.videoTitle;
      const media = button.closest('.story-media');
      if (!media || !id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&cc_load_policy=1`;
      iframe.title = title || 'Patient story video';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      media.replaceChildren(iframe);
      iframe.focus();
    });
  });
})();
