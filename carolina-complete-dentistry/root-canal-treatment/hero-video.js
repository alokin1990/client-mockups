(() => {
  const video = document.querySelector("[data-hero-video]");
  const button = document.querySelector("[data-video-toggle]");
  const hero = document.getElementById("rc-01");
  if (!video || !button || !hero) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  let inView = true;
  let userPaused = false;
  let failed = false;
  video.muted = true;
  const sync = () => {
    const staticMode = reduced.matches || connection?.saveData;
    button.hidden = staticMode || failed;
    button.textContent = userPaused ? "Play video" : "Pause video";
    button.setAttribute("aria-label", userPaused ? "Play background video" : "Pause background video");
    button.setAttribute("aria-pressed", String(userPaused));
    if (staticMode) {
      video.pause();
      if (video.hasAttribute("src")) { video.removeAttribute("src"); video.load(); }
      return;
    }
    if (inView && !document.hidden && !userPaused && !failed) {
      if (!video.hasAttribute("src")) video.src = video.dataset.src;
      video.play().catch(() => { userPaused = true; button.textContent = "Play video"; button.setAttribute("aria-label", "Play background video"); button.setAttribute("aria-pressed", "true"); });
    } else video.pause();
  };
  button.addEventListener("click", () => { userPaused = !userPaused; sync(); });
  video.addEventListener("error", () => { failed = true; sync(); });
  reduced.addEventListener("change", sync);
  connection?.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  const observer = new IntersectionObserver((entries) => { inView = entries[0].isIntersecting; sync(); }, { threshold: 0.05 });
  observer.observe(hero);
  addEventListener("pagehide", () => { observer.disconnect(); video.pause(); reduced.removeEventListener("change", sync); connection?.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); }, { once: true });
  sync();
})();
