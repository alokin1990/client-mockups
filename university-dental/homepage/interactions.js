const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  header.classList.remove('menu-open');
  nav.querySelectorAll('details[open]').forEach(item => { item.open = false; });
};

menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  header.classList.toggle('menu-open', !expanded);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (header.classList.contains('menu-open')) {
    closeMenu();
    menuButton.focus();
  } else {
    const opened = nav.querySelector('details[open]');
    if (opened) {
      opened.open = false;
      opened.querySelector('summary').focus();
    }
  }
});
nav.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => {
  if (detail.open) nav.querySelectorAll('details').forEach(other => { if (other !== detail) other.open = false; });
}));
document.addEventListener('click', event => {
  if (!header.contains(event.target)) nav.querySelectorAll('details[open]').forEach(detail => { detail.open = false; });
});
window.matchMedia('(min-width: 901px)').addEventListener('change', closeMenu);
document.querySelectorAll('#faq-list details').forEach(detail => detail.addEventListener('toggle', () => {
  if (detail.open) document.querySelectorAll('#faq-list details').forEach(other => { if (other !== detail) other.open = false; });
}));

const galleryLinks = [...document.querySelectorAll('[data-gallery-index]')];
const galleryDialog = document.querySelector('.gallery-dialog');
const enlargedPhoto = galleryDialog.querySelector('.gallery-enlarged');
const galleryCount = galleryDialog.querySelector('.gallery-count');
let galleryIndex = 0;
let galleryOpener = null;
function showGalleryPhoto(index) {
  galleryIndex = (index + galleryLinks.length) % galleryLinks.length;
  const link = galleryLinks[galleryIndex];
  enlargedPhoto.src = link.href;
  enlargedPhoto.alt = link.querySelector('img').alt;
  galleryCount.textContent = `${galleryIndex + 1} of ${galleryLinks.length}`;
}
galleryLinks.forEach((link, index) => link.addEventListener('click', event => {
  if (!galleryDialog.showModal) return;
  event.preventDefault();
  galleryOpener = link;
  showGalleryPhoto(index);
  galleryDialog.showModal();
  galleryDialog.querySelector('.gallery-close').focus();
}));
galleryDialog.querySelector('.gallery-close').addEventListener('click', () => galleryDialog.close());
galleryDialog.querySelector('.gallery-previous').addEventListener('click', () => showGalleryPhoto(galleryIndex - 1));
galleryDialog.querySelector('.gallery-next').addEventListener('click', () => showGalleryPhoto(galleryIndex + 1));
galleryDialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') { event.preventDefault(); showGalleryPhoto(galleryIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showGalleryPhoto(galleryIndex - 1); }
});
galleryDialog.addEventListener('close', () => galleryOpener?.focus());
galleryDialog.addEventListener('click', event => {
  const bounds = galleryDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) galleryDialog.close();
});

const mobileActions = document.querySelector('.mobile-actions');
const heroActions = document.querySelector('#hero-actions');
const mobileQuery = window.matchMedia('(max-width: 640px)');
function updateMobileActions() {
  const shouldShow = mobileQuery.matches && heroActions.getBoundingClientRect().bottom < 0 && !galleryDialog.open;
  mobileActions.hidden = !shouldShow;
  document.body.classList.toggle('has-mobile-actions', shouldShow);
}
const heroObserver = new IntersectionObserver(updateMobileActions);
heroObserver.observe(heroActions);
mobileQuery.addEventListener('change', updateMobileActions);
galleryDialog.addEventListener('close', updateMobileActions);
galleryLinks.forEach(link => link.addEventListener('click', updateMobileActions));
updateMobileActions();

// Load the actual YouTube player only after the visitor chooses to play.
const videoLaunch = document.querySelector('.video-launch');
videoLaunch?.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const videoId = videoLaunch.dataset.videoId;
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return;
  event.preventDefault();
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  frame.title = 'Replacing Missing Teeth with Dental Implants with Dr. Armin Hage — The Wellness Hour';
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allowFullscreen = true;
  frame.tabIndex = 0;
  videoLaunch.replaceWith(frame);
  frame.focus();
});
