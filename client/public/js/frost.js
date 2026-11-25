/* =========================================================
   frost.js - Light falling ice crystals in the hero and page
   headers (the "ice" touch of the Mint Frost theme)
   ========================================================= */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const FLAKE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
    <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/>
    <path d="m9.5 3.5 2.5 2 2.5-2M9.5 20.5l2.5-2 2.5 2M4 10.3l3.1-.6-1-3M20 13.7l-3.1.6 1 3M4 13.7l3.1.6-1 3M20 10.3l-3.1-.6 1-3"/>
  </svg>`;

  function addFrost(container, count) {
    const layer = document.createElement("div");
    layer.className = "frost-layer";
    layer.setAttribute("aria-hidden", "true");
    for (let i = 0; i < count; i++) {
      const f = document.createElement("span");
      f.className = "frost-flake";
      const size = 8 + Math.random() * 14;
      f.style.width = f.style.height = size + "px";
      f.style.left = Math.random() * 100 + "%";
      f.style.animationDuration = 9 + Math.random() * 10 + "s";
      f.style.animationDelay = -Math.random() * 15 + "s";
      f.style.setProperty("--drift", (Math.random() * 80 - 40).toFixed(0) + "px");
      // some crystals get a lavender tint
      if (Math.random() < 0.35) f.style.color = "rgba(221, 214, 254, .95)";
      f.innerHTML = FLAKE;
      layer.appendChild(f);
    }
    container.prepend(layer);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const small = window.innerWidth < 640;
    document.querySelectorAll(".hero, .page-header").forEach(el => addFrost(el, small ? 8 : 16));
  });
})();
