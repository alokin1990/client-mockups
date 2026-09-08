// Mobile scroll CTA contract
(() => {
  const mobileActions = document.querySelector("[data-mobile-scroll-cta]");
  const heroActions = document.querySelector(
    "[data-viewport-hero] .button-row",
  );
  const finalCta = document.querySelector(".final-cta");
  const mobileViewport = window.matchMedia("(max-width: 900px)");
  let animationFrame = 0;

  if (!mobileActions || !heroActions) return;

  const isVisibleInViewport = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  const updateMobileActions = () => {
    const visible =
      mobileViewport.matches &&
      window.scrollY > 0 &&
      !isVisibleInViewport(heroActions) &&
      !isVisibleInViewport(finalCta);
    mobileActions.classList.toggle("is-visible", visible);
    mobileActions.toggleAttribute("inert", !visible);
    mobileActions.setAttribute("aria-hidden", String(!visible));
  };

  const scheduleUpdate = () => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(updateMobileActions);
  };

  scheduleUpdate();
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("orientationchange", scheduleUpdate, {
    passive: true,
  });
})();
