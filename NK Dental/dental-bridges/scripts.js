(() => {
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const header = document.querySelector("[data-header]");

  const setMenuState = (open) => {
    if (!menuToggle || !menu) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  };

  menuToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    setMenuState(open);
  });

  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuState(false);
  });

  document.addEventListener("click", (event) => {
    if (
      window.matchMedia("(max-width: 900px)").matches &&
      menuToggle?.getAttribute("aria-expanded") === "true" &&
      !header?.contains(event.target)
    ) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuToggle?.getAttribute("aria-expanded") === "true"
    ) {
      setMenuState(false);
      menuToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setMenuState(false);
  });

  document
    .querySelector("[data-year]")
    ?.replaceChildren(String(new Date().getFullYear()));

  document.querySelectorAll("[data-track]").forEach((link) => {
    link.addEventListener("click", () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "nk_cta_click",
        cta_location: link.dataset.track,
        cta_destination: link.getAttribute("href"),
      });
    });
  });

  document.querySelectorAll(".faq-list details").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "nk_faq_open",
        faq_question: item.querySelector("summary")?.textContent?.trim(),
      });
    });
  });

  document.querySelector(".map-wrap iframe")?.addEventListener("load", () => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "nk_map_load",
      map_location: "bucktown-office",
    });
  });
})();
