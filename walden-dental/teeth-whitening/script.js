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
const videoFrame = document.querySelector('[data-video-id="4Jbr7LDTjIk"]');
videoFrame?.querySelector('.play-button')?.addEventListener('click', () => {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube-nocookie.com/embed/4Jbr7LDTjIk?autoplay=1&rel=0&playsinline=1&cc_load_policy=1';
  iframe.title = 'Walden Dental video about professional teeth whitening';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.tabIndex = 0;
  videoFrame.replaceChildren(iframe);
  videoFrame.classList.add('is-playing');
  iframe.focus();
});
