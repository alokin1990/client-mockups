const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#main-menu");

if (menuButton && menu) {
  const dropdowns = [...menu.querySelectorAll(".nav-dropdown")];
  const closeDropdowns = () => {
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("is-open");
      dropdown.querySelector("button").setAttribute("aria-expanded", "false");
    });
  };
  const closeMenu = () => {
    menu.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    closeDropdowns();
  };
  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector("button");
    button.addEventListener("click", () => {
      const wasOpen = dropdown.classList.contains("is-open");
      closeDropdowns();
      dropdown.classList.toggle("is-open", !wasOpen);
      button.setAttribute("aria-expanded", String(!wasOpen));
    });
  });
  menuButton.addEventListener("click", () => {
    const open = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && event.target !== menuButton)
      closeDropdowns();
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  });
}
