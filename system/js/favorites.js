// ---- Boot helpers and missing functions ----

// Ensure we have a safe initFavorites that other code can call
window.initFavorites = function initFavorites() {
  if (!window.favorites) {
    // If favorites IIFE didn't run for some reason, ensure a Set exists
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(Array.isArray(stored) ? stored : []);
    } catch (e) {
      window.favorites = new Set();
    }
  }

  // ensure saveFavorites exists (your IIFE already defines it; fallback if not)
  if (!window.saveFavorites) {
    window.saveFavorites = function () {
      try {
        localStorage.setItem("favorites", JSON.stringify([...window.favorites]));
      } catch (e) {
        console.error("Failed to save favorites:", e);
      }
    };
  }

  // Provide refreshCards so the star click handler can rerender
  if (!window.refreshCards) {
    window.refreshCards = function refreshCards() {
      if (!window.assetsData) {
        // nothing loaded yet — nothing to refresh
        return;
      }
      // Rebuild cards from the current assetsData (preserves favorites state)
      const imagePromises = createAssetCards(window.assetsData || []);
      // After recreating cards, render current page
      if (typeof renderPage === "function") renderPage();
      // Optionally start placeholders if they rely on cards
      if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();
      return imagePromises;
    };
  }
};

// Make showLoading target the preloader's text area (safer than wiping container)
function showLoading(text) {
  // prefer the preloader's loaderText if available
  const loaderText = (window.dom && window.dom.loaderText) || null;
  const preloader = (window.dom && window.dom.preloader) || null;

  if (loaderText) {
    loaderText.textContent = text;
  } else if (preloader) {
    // fallback: put a simple text node inside preloader
    preloader.textContent = text;
    preloader.style.textAlign = "center";
  } else if (window.dom && window.dom.container) {
    // last resort (avoid wiping the entire page if possible)
    console.warn("Preloader elements missing; writing to container as fallback.");
    const container = window.dom.container;
    container.textContent = text;
    container.style.textAlign = "center";
  } else {
    console.warn("No place to show loading text:", text);
  }
}

// Wire the preloader-created elements into dom so other modules can use them.
// Replace or extend your initPreloader() block with the lines below OR keep initPreloader as-is
// and ensure it sets dom.loaderText and dom.progressBarFill (the example below assumes initPreloader runs).
(function ensurePreloaderDomBindings() {
  // If initPreloader creates elements later, attach after DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    if (!window.dom) window.dom = {};
    const preloader = document.getElementById("preloader");
    if (!preloader) return;

    // If your initPreloader created nodes already, try to find them:
    let loaderText = preloader.querySelector(".load-progress-text");
    let progressFill = preloader.querySelector(".load-progress-fill");
    let loaderImage = document.getElementById("loaderImage") || preloader.querySelector("img#loaderImage");

    // If elements don't exist yet, create minimal placeholders to avoid runtime errors
    if (!loaderText) {
      loaderText = document.createElement("div");
      loaderText.className = "load-progress-text";
      preloader.appendChild(loaderText);
    }
    if (!progressFill) {
      const progressBar = document.createElement("div");
      progressBar.className = "load-progress-bar";
      const progressBarFill = document.createElement("div");
      progressBarFill.className = "load-progress-fill";
      progressBar.appendChild(progressBarFill);
      preloader.appendChild(progressBar);
      progressFill = progressBarFill;
    }

    // attach to global dom object so updateProgress, showLoading, etc. can use them
    dom.preloader = preloader;
    dom.loaderText = loaderText;
    dom.progressBarFill = progressFill;
    if (loaderImage) dom.loaderImage = loaderImage;
  }, { once: true });
})();
