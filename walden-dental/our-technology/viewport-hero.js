(() => {
  let animationFrame = 0;
  const measure = () => {
    document.querySelectorAll('[data-viewport-hero]').forEach((hero) => {
      const top = hero.getBoundingClientRect().top + window.scrollY;
      const available = Math.max(0, window.innerHeight - top);
      const density = window.matchMedia('(max-width: 850px)').matches ? 'tight' : 'comfortable';
      hero.style.setProperty('--first-screen-offset', `${Math.max(0, top).toFixed(2)}px`);
      hero.setAttribute('data-hero-density', density);
      const fitted = hero.scrollHeight <= hero.clientHeight + 1 && hero.getBoundingClientRect().height <= available + 1;
      hero.setAttribute('data-first-screen-fit', String(fitted));
      hero.setAttribute('data-first-screen-ready', 'true');
    });
  };
  const schedule = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(measure);
  };
  measure();
  addEventListener('resize', schedule, {passive:true});
  addEventListener('orientationchange', schedule, {passive:true});
  document.fonts?.ready.then(measure);
})();