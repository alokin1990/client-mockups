const menuButton = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('#mobile-menu');
const menuClose = document.querySelector('.menu-close');

function setMenu(open) {
  if (!menuButton || !menuPanel) return;
  menuPanel.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (open) menuClose?.focus();
  else menuButton.focus();
}

menuButton?.addEventListener('click', () => setMenu(menuPanel?.hidden));
menuClose?.addEventListener('click', () => setMenu(false));
menuPanel?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuPanel && !menuPanel.hidden) setMenu(false);
});
document.addEventListener('click', event => {
  if (menuPanel && !menuPanel.hidden && !menuPanel.contains(event.target) && !menuButton?.contains(event.target)) setMenu(false);
});
window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
  if (event.matches && menuPanel && !menuPanel.hidden) setMenu(false);
});


// One mobile appointment action appears only between the hero and closing CTA.
const mobileStickyCta = document.querySelector('.mobile-sticky-cta');
const heroActionGroup = document.querySelector('.hero-actions');
const finalActionSection = document.querySelector('#final-action');
const finalPrimaryAction = finalActionSection?.querySelector('[data-element="final-actions"] .button');
const stickyMedia = window.matchMedia('(max-width: 900px)');
let stickyFrame = 0;
function updateMobileStickyCta() {
  if (!mobileStickyCta || !heroActionGroup || !finalPrimaryAction) return;
  const heroPassed = heroActionGroup.getBoundingClientRect().bottom < 0;
  const finalRect = finalPrimaryAction.getBoundingClientRect();
  const finalActionReady = (finalRect.top >= 0 && finalRect.bottom <= window.innerHeight) || finalRect.bottom < 0;
  const menuOpen = menuPanel && !menuPanel.hidden;
  const show = stickyMedia.matches && heroPassed && !finalActionReady && !menuOpen;
  if (!show && document.activeElement === mobileStickyCta) {
    const next = menuOpen ? menuClose : finalActionReady ? finalPrimaryAction : heroActionGroup.querySelector('a');
    next?.focus({ preventScroll: true });
  }
  mobileStickyCta.hidden = !show;
}
function scheduleMobileStickyCta() {
  cancelAnimationFrame(stickyFrame);
  stickyFrame = requestAnimationFrame(updateMobileStickyCta);
}
window.addEventListener('scroll', scheduleMobileStickyCta, { passive: true });
window.addEventListener('resize', scheduleMobileStickyCta, { passive: true });
stickyMedia.addEventListener('change', scheduleMobileStickyCta);
if (menuPanel) new MutationObserver(scheduleMobileStickyCta).observe(menuPanel, { attributes: true, attributeFilter: ['hidden'] });
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleMobileStickyCta, { once: true });
else scheduleMobileStickyCta();

// On small screens, show a short two-column list and reveal the rest on request.
// Without JavaScript, all city links remain visible.
const directionsSection = document.querySelector('#nearby-directions');
const directionsToggle = directionsSection?.querySelector('.directions-toggle');
const directionsMobile = window.matchMedia('(max-width: 700px)');
let directionsExpanded = false;
function updateDirectionsLayout() {
  if (!directionsSection || !directionsToggle) return;
  if (!directionsMobile.matches) {
    directionsSection.removeAttribute('data-collapsed');
    directionsToggle.hidden = true;
    return;
  }
  directionsSection.dataset.collapsed = String(!directionsExpanded);
  directionsToggle.hidden = false;
  directionsToggle.setAttribute('aria-expanded', String(directionsExpanded));
  directionsToggle.textContent = directionsExpanded ? 'Show fewer cities' : 'Show all 10 cities';
}
directionsToggle?.addEventListener('click', () => {
  directionsExpanded = !directionsExpanded;
  updateDirectionsLayout();
});
directionsMobile.addEventListener('change', updateDirectionsLayout);
updateDirectionsLayout();

// Keep keyboard-focused city routes and their focus rings fully within the desktop rail.
const directionsRail = document.querySelector('.directions-rail');
directionsRail?.addEventListener('focusin', event => {
  if (directionsMobile.matches) return;
  const link = event.target;
  if (!(link instanceof HTMLAnchorElement)) return;
  requestAnimationFrame(() => {
    const railBox = directionsRail.getBoundingClientRect();
    const linkBox = link.getBoundingClientRect();
    const clearance = 10;
    if (linkBox.left < railBox.left + clearance) {
      directionsRail.scrollLeft += linkBox.left - railBox.left - clearance;
    } else if (linkBox.right > railBox.right - clearance) {
      directionsRail.scrollLeft += linkBox.right - railBox.right + clearance;
    }
  });
});
