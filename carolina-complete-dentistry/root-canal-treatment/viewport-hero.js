// First-screen hero contract
(() => {
  const heroSelector = "[data-viewport-hero]";
  const chromeSelector = "[data-viewport-chrome]";
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
  } else {
    scheduleMeasurement();
  }

  window.addEventListener("resize", scheduleMeasurement, { passive: true });
  window.addEventListener("orientationchange", scheduleMeasurement, {
    passive: true,
  });
  document.fonts?.ready.then(scheduleMeasurement);

  if ("ResizeObserver" in window) {
    const firstScreenObserver = new ResizeObserver(scheduleMeasurement);
    document
      .querySelectorAll(`${chromeSelector}, ${tailSelector}`)
      .forEach((element) => firstScreenObserver.observe(element));
  }
})();
