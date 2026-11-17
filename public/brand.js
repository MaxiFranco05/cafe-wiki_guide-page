/**
 * Portable Brand Binding — Single source of truth for provisional product name.
 * Replace BRAND_NAME here to update all HTML previews and mockups automatically.
 */
(function () {
  const BRAND_NAME = "Atelier Brew (TBD)";
  const BRAND_SHORT = "Atelier Brew";

  function applyBrand() {
    const nodes = document.querySelectorAll("[data-brand-name]");
    nodes.forEach((node) => {
      const format = node.getAttribute("data-brand-name");
      node.textContent = format === "short" ? BRAND_SHORT : BRAND_NAME;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyBrand);
  } else {
    applyBrand();
  }
})();
