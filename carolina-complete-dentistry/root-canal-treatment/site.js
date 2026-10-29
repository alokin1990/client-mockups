document.documentElement.classList.add("js");
const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#main-menu");
if (menuButton && menu) {
  const setMenu = (open, restoreFocus = false) => {
    menuButton.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    if (!open && restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) setMenu(false, true);
  });
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (event.matches) setMenu(false);
  });
}

// Same-page links land on a heading and carry keyboard focus with them.
document.querySelectorAll('a[href^="#rc-"]').forEach((link) => {
  link.addEventListener("click", () => {
    const target = document.getElementById(link.getAttribute("href").slice(1));
    const heading = target?.querySelector("h2");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    requestAnimationFrame(() => heading.focus({ preventScroll: true }));
  });
});
