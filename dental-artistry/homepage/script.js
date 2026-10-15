(() => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (toggle && menu) {
    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.removeAttribute('data-open');
    };
    toggle.addEventListener('click', () => {
      const opening = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(opening));
      if (opening) menu.setAttribute('data-open', 'true');
      else close();
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.hasAttribute('data-open')) {
        close();
        toggle.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (menu.hasAttribute('data-open') && !menu.contains(event.target) && !toggle.contains(event.target)) close();
    });
  }

  const serviceTabs = [...document.querySelectorAll('.service-tabs [role="tab"]')];
  if (serviceTabs.length) {
    const activateServiceTab = (nextTab, moveFocus = false) => {
      serviceTabs.forEach((tab) => {
        const active = tab === nextTab;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) panel.hidden = !active;
      });
      if (moveFocus) nextTab.focus();
    };
    serviceTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateServiceTab(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? serviceTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + serviceTabs.length) % serviceTabs.length;
        activateServiceTab(serviceTabs[nextIndex], true);
      });
    });
    const activateLinkedTab = () => {
      const tab = serviceTabs.find((item) => item.id === window.location.hash.slice(1));
      if (tab) activateServiceTab(tab);
    };
    document.querySelectorAll('[data-open-service-tab]').forEach((link) => {
      link.addEventListener('click', () => {
        const tab = serviceTabs.find((item) => item.id === link.dataset.openServiceTab);
        if (tab) activateServiceTab(tab);
      });
    });
    window.addEventListener('hashchange', activateLinkedTab);
    activateLinkedTab();
  }

  const hero = document.querySelector('[data-viewport-hero]');
  const chrome = document.querySelector('[data-viewport-chrome]');
  if (hero && chrome) {
    let frame = 0;
    const fit = () => {
      const documentTop = hero.getBoundingClientRect().top + window.scrollY;
      const availableHeight = Math.max(0, window.innerHeight - documentTop);
      hero.style.setProperty('--first-screen-offset', `${Math.max(0, documentTop).toFixed(2)}px`);
      let fitted = false;
      for (const density of ['comfortable', 'compact', 'tight']) {
        hero.setAttribute('data-hero-density', density);
        fitted = hero.getBoundingClientRect().height <= availableHeight + 1 && hero.scrollHeight <= hero.clientHeight + 1;
        if (fitted) break;
      }
      hero.setAttribute('data-first-screen-fit', String(fitted));
      hero.setAttribute('data-first-screen-ready', 'true');
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('load', schedule, { once: true });
    if (document.fonts?.ready) document.fonts.ready.then(schedule);
    schedule();
  }

  const heroVideo = document.querySelector('[data-hero-video]');
  const videoSource = heroVideo?.querySelector('source[data-src]');
  const videoBackground = heroVideo?.closest('.hero-video-bg');
  if (hero && heroVideo && videoSource && videoBackground) {
    const desktop = window.matchMedia('(min-width: 761px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = true;
    let loaded = false;
    const syncVideo = () => {
      const motionAllowed = desktop.matches && !reducedMotion.matches;
      const shouldPlay = motionAllowed && inView && !document.hidden;
      if (!shouldPlay) {
        heroVideo.pause();
        videoBackground.removeAttribute('data-playing');
        if (!motionAllowed && loaded) {
          videoSource.removeAttribute('src');
          heroVideo.load();
          loaded = false;
        }
        return;
      }
      if (!loaded) {
        videoSource.src = videoSource.dataset.src;
        heroVideo.load();
        loaded = true;
      }
      heroVideo.play().catch(() => videoBackground.removeAttribute('data-playing'));
    };
    heroVideo.addEventListener('playing', () => videoBackground.setAttribute('data-playing', 'true'));
    heroVideo.addEventListener('pause', () => videoBackground.removeAttribute('data-playing'));
    desktop.addEventListener('change', syncVideo);
    reducedMotion.addEventListener('change', syncVideo);
    document.addEventListener('visibilitychange', syncVideo);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        syncVideo();
      }, { threshold: 0.1 }).observe(hero);
    } else {
      syncVideo();
    }
  }

  const lab = document.querySelector('#in-house-lab');
  const labVideo = lab?.querySelector('[data-lab-video]');
  const labSource = labVideo?.querySelector('source[data-src]');
  const labBackground = labVideo?.closest('.lab-video-bg');
  if (lab && labVideo && labSource && labBackground) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = false;
    let loaded = false;
    const syncLabVideo = () => {
      if (reducedMotion.matches || !inView || document.hidden) {
        labVideo.pause();
        labBackground.removeAttribute('data-playing');
        return;
      }
      if (!loaded) {
        labSource.src = labSource.dataset.src;
        labVideo.load();
        loaded = true;
      }
      labVideo.play().catch(() => labBackground.removeAttribute('data-playing'));
    };
    labVideo.addEventListener('playing', () => labBackground.setAttribute('data-playing', 'true'));
    labVideo.addEventListener('pause', () => labBackground.removeAttribute('data-playing'));
    reducedMotion.addEventListener('change', syncLabVideo);
    document.addEventListener('visibilitychange', syncLabVideo);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        syncLabVideo();
      }, { threshold: 0.1 }).observe(lab);
    } else {
      inView = true;
      syncLabVideo();
    }
  }

  const tourLightbox = document.querySelector('[data-tour-lightbox]');
  const tourImage = tourLightbox?.querySelector('[data-tour-full-image]');
  const tourCaption = tourLightbox?.querySelector('[data-tour-caption]');
  const tourClose = tourLightbox?.querySelector('[data-tour-close]');
  if (tourLightbox && tourImage && tourCaption && tourClose && typeof tourLightbox.showModal === 'function') {
    let opener = null;
    document.querySelectorAll('.tour-photo-link').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        opener = link;
        const thumbnail = link.querySelector('img');
        tourImage.src = link.href;
        tourImage.alt = thumbnail?.alt || 'Dental Artistry office';
        tourCaption.textContent = tourImage.alt;
        tourLightbox.showModal();
        tourClose.focus();
      });
    });
    tourClose.addEventListener('click', () => tourLightbox.close());
    tourLightbox.addEventListener('click', (event) => {
      if (event.target === tourLightbox) tourLightbox.close();
    });
    tourLightbox.addEventListener('close', () => {
      tourImage.removeAttribute('src');
      opener?.focus();
    });
  }

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealTargets = document.querySelectorAll('.section-intro, .reason-card, .care-card, .provider-card, .recognition-gallery figure, .tour-photo, .office-card');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute('data-revealed', 'true');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    revealTargets.forEach((target) => revealObserver.observe(target));
  }
})();
