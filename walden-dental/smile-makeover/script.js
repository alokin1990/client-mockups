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
      if (window.innerWidth > 1080) {
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

  const storyTablist = document.querySelector('[data-story-tabs]');
  if (storyTablist) {
    const storyTabs = [...storyTablist.querySelectorAll('[role="tab"]')];
    const storyPanels = storyTabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

    if (storyTabs.length === 4 && storyPanels.every(Boolean)) {
      const selectStory = (selectedIndex, moveFocus = false) => {
        storyTabs.forEach((tab, index) => {
          const selected = index === selectedIndex;
          tab.setAttribute('aria-selected', String(selected));
          tab.tabIndex = selected ? 0 : -1;
          storyPanels[index].hidden = !selected;
        });
        if (moveFocus) storyTabs[selectedIndex].focus();
      };

      storyTabs.forEach((tab, index) => {
        const panel = storyPanels[index];
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        panel.tabIndex = 0;

        tab.addEventListener('click', () => selectStory(index));
        tab.addEventListener('keydown', (event) => {
          let nextIndex;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % storyTabs.length;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + storyTabs.length) % storyTabs.length;
          if (event.key === 'Home') nextIndex = 0;
          if (event.key === 'End') nextIndex = storyTabs.length - 1;
          if (nextIndex === undefined) return;
          event.preventDefault();
          selectStory(nextIndex, true);
        });
      });

      selectStory(0);
      storyTablist.classList.add('is-ready');
    }
  }

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

