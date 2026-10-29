(() => {
  const bar = document.querySelector("[data-mobile-scroll-cta]");
  const heroActions = document.querySelector("[data-element='hero-actions']");
  const finalActions = document.querySelector(".final-cta");
  const menuButton = document.querySelector(".menu-toggle");
  const mobile = window.matchMedia("(max-width: 900px)");
  let frame = 0;
  if (!bar || !heroActions || !finalActions) return;
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };
  const update = () => {
    const active = document.activeElement;
    const rect = active?.getBoundingClientRect();
    const focusWouldBeCovered = active && active !== document.body && !bar.contains(active) && rect && rect.height > 0 && rect.bottom > window.innerHeight - 84 && rect.top < window.innerHeight;
    const show = mobile.matches && window.scrollY > 0 && !visible(heroActions) && !visible(finalActions) && menuButton?.getAttribute("aria-expanded") !== "true" && !focusWouldBeCovered;
    bar.classList.toggle("is-visible", Boolean(show));
    bar.toggleAttribute("inert", !show);
    bar.setAttribute("aria-hidden", String(!show));
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("orientationchange", schedule, { passive: true });
  document.addEventListener("focusin", schedule);
  document.addEventListener("focusout", schedule);
  if (menuButton) new MutationObserver(schedule).observe(menuButton, { attributes: true, attributeFilter: ["aria-expanded"] });
  schedule();
})();
