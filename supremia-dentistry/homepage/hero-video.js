(() => {
  const hero = document.querySelector('#hero');
  const video = hero?.querySelector('.hero-video');
  const source = video?.querySelector('source[data-src]');
  const control = hero?.querySelector('.hero-motion-toggle');
  if (!hero || !video || !source || !control) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowScreen = window.matchMedia('(max-width: 640px)');
  let inView = true;
  let userPaused = false;
  let failed = false;

  function allowed() {
    return !reducedMotion.matches && !narrowScreen.matches && !navigator.connection?.saveData;
  }

  function showControl(isPlaying) {
    control.hidden = false;
    control.textContent = isPlaying ? 'Pause video' : 'Play video';
    control.setAttribute('aria-label', isPlaying ? 'Pause background video' : 'Play background video');
    video.classList.toggle('is-playing', isPlaying);
  }

  function useStill() {
    failed = true;
    video.pause();
    video.classList.remove('is-playing');
    control.hidden = true;
  }

  async function resume() {
    if (failed || !allowed() || !inView || document.hidden || userPaused) return;
    try {
      await video.play();
    } catch {
      // Autoplay can be denied; a visible control allows a user-initiated play.
      showControl(false);
    }
  }

  function updateEligibility() {
    if (!allowed()) {
      video.pause();
      video.classList.remove('is-playing');
      control.hidden = true;
      return;
    }
    if (!source.hasAttribute('src')) {
      source.src = source.dataset.src;
      video.load();
    }
    void resume();
  }

  video.addEventListener('playing', () => showControl(true));
  video.addEventListener('pause', () => {
    video.classList.remove('is-playing');
    if (!failed && allowed() && !document.hidden && inView) showControl(false);
  });
  video.addEventListener('error', useStill);
  source.addEventListener('error', useStill);
  control.addEventListener('click', () => {
    userPaused = !video.paused;
    if (userPaused) {
      video.pause();
      showControl(false);
    } else {
      void resume();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else void resume();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = !!entry?.isIntersecting;
      if (!inView) video.pause();
      else void resume();
    }, {threshold: 0.05}).observe(hero);
  }
  reducedMotion.addEventListener('change', updateEligibility);
  narrowScreen.addEventListener('change', updateEligibility);
  navigator.connection?.addEventListener?.('change', updateEligibility);
  updateEligibility();
})();
