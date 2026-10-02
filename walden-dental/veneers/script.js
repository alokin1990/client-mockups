const menuButton = document.querySelector('.menu-toggle');
const mainMenu = document.querySelector('[data-menu]');
if (menuButton && mainMenu) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    mainMenu.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      menuButton.setAttribute('aria-expanded', 'false');
      mainMenu.classList.remove('is-open');
      document.querySelectorAll('.nav-dropdown.is-open').forEach(item => {
        item.classList.remove('is-open');
        item.querySelector('button')?.setAttribute('aria-expanded', 'false');
      });
    }
  });
}
document.querySelectorAll('.nav-dropdown > button').forEach(button => {
  button.addEventListener('click', () => {
    const parent = button.closest('.nav-dropdown');
    const open = button.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('.nav-dropdown.is-open').forEach(item => {
      if (item !== parent) {
        item.classList.remove('is-open');
        item.querySelector('button')?.setAttribute('aria-expanded', 'false');
      }
    });
    parent?.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  });
});
const videoFrame = document.querySelector('[data-video-id="832712679"]');
videoFrame?.querySelector('.play-button')?.addEventListener('click', () => {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://player.vimeo.com/video/832712679?autoplay=1';
  iframe.title = 'Walden Dental patient testimonial about front-tooth care';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.tabIndex = 0;
  videoFrame.replaceChildren(iframe);
  videoFrame.classList.add('is-playing');
  iframe.focus();
});
const storyTablist = document.querySelector('[data-story-tabs]');
if (storyTablist) {
  const storyTabs = [...storyTablist.querySelectorAll('[role="tab"]')];
  const storyPanels = storyTabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  if (storyTabs.length === 5 && storyPanels.every(Boolean)) {
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
      tab.addEventListener('keydown', event => {
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
const faqGroup = document.querySelectorAll('.faq-list details');
faqGroup.forEach(detail => detail.addEventListener('toggle', () => {
  if (detail.open) faqGroup.forEach(other => { if (other !== detail) other.open = false; });
}));
