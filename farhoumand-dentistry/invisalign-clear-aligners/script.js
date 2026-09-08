const body = document.body;
const menu = document.querySelector("[data-menu]");
const menuToggle = document.querySelector(".menu-toggle");
const menuClose = document.querySelector(".menu-close");
const floatingAction = document.querySelector(".floating-action");
const heroActions = document.querySelector("#hero-actions");
const finalCta = document.querySelector("[data-final-cta]");
const modal = document.querySelector("#appointment-modal");
let previousFocus = null;

function setMenu(open) {
  if (!menu || !menuToggle) return;
  menu.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  body.classList.toggle("menu-open", open);
  if (open) menuClose?.focus();
  else menuToggle.focus();
}

menuToggle?.addEventListener("click", () => setMenu(true));
menuClose?.addEventListener("click", () => setMenu(false));
menu?.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    menu.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    body.classList.remove("menu-open");
  }),
);

function setModal(open) {
  if (!modal) return;
  if (open) {
    previousFocus = document.activeElement;
    modal.hidden = false;
    body.classList.add("modal-open");
    modal.querySelector(".modal-close")?.focus();
  } else {
    modal.hidden = true;
    body.classList.remove("modal-open");
    previousFocus?.focus?.();
  }
}

document.querySelectorAll("[data-open-modal]").forEach((button) =>
  button.addEventListener("click", (event) => {
    event.preventDefault();
    setModal(true);
  }),
);
document
  .querySelectorAll("[data-close-modal]")
  .forEach((button) => button.addEventListener("click", () => setModal(false)));

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (modal && !modal.hidden) setModal(false);
  else if (menu?.classList.contains("is-open")) setMenu(false);
});

if (floatingAction && heroActions) {
  let heroActionsVisible = true;
  let finalCtaVisible = false;
  const updateFloatingAction = () => {
    const visible =
      window.matchMedia("(max-width: 900px)").matches &&
      !heroActionsVisible &&
      !finalCtaVisible;
    floatingAction.classList.toggle("is-visible", visible);
    floatingAction.toggleAttribute("inert", !visible);
    floatingAction.setAttribute("aria-hidden", String(!visible));
  };
  new IntersectionObserver(
    ([entry]) => {
      heroActionsVisible = entry.isIntersecting;
      updateFloatingAction();
    },
    { threshold: 0.1 },
  ).observe(heroActions);
  if (finalCta) {
    new IntersectionObserver(
      ([entry]) => {
        finalCtaVisible = entry.isIntersecting;
        updateFloatingAction();
      },
      { threshold: 0.08 },
    ).observe(finalCta);
  }
}

// Initialize the project first-screen contract and select the least dense
// readable hero composition that fits the active viewport.
(() => {
  const heroSelector = "[data-viewport-hero]";
  const tailSelector = '[data-viewport-tail="desktop"]';
  const desktopTail = window.matchMedia("(min-width: 901px)");
  const densityLevels = ["comfortable", "compact", "tight"];
  let animationFrame = 0;

  const measureFirstScreen = () => {
    const activeTails = desktopTail.matches
      ? [...document.querySelectorAll(tailSelector)]
      : [];
    const tailHeight = activeTails.reduce(
      (height, tail) => height + tail.getBoundingClientRect().height,
      0,
    );
    document.querySelectorAll(heroSelector).forEach((hero) => {
      const documentTop = hero.getBoundingClientRect().top + window.scrollY;
      const availableHeight = Math.max(
        0,
        window.innerHeight - documentTop - tailHeight,
      );
      hero.style.setProperty(
        "--first-screen-offset",
        `${Math.max(0, documentTop).toFixed(2)}px`,
      );
      hero.style.setProperty(
        "--first-screen-tail-size",
        `${tailHeight.toFixed(2)}px`,
      );
      let fitted = false;
      for (const density of densityLevels) {
        hero.setAttribute("data-hero-density", density);
        fitted =
          hero.getBoundingClientRect().height <= availableHeight + 1 &&
          hero.scrollHeight <= hero.clientHeight + 1;
        if (fitted) break;
      }
      hero.setAttribute("data-first-screen-fit", String(fitted));
      hero.setAttribute("data-first-screen-ready", "true");
    });
  };

  const scheduleMeasurement = () => {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = window.requestAnimationFrame(measureFirstScreen);
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleMeasurement, {
      once: true,
    });
  } else scheduleMeasurement();
  window.addEventListener("resize", scheduleMeasurement, { passive: true });
  window.addEventListener("orientationchange", scheduleMeasurement, {
    passive: true,
  });
  document.fonts?.ready.then(scheduleMeasurement);
})();
