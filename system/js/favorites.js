// ---- favorites.js ----
// Safe boot helpers for favorites, preloader bindings, and refresh routines

(function initFavoritesBoot() {
  // --- Ensure global favorite state ---
  window.initFavorites = function initFavorites() {
    // 1️⃣ Restore favorites from localStorage or create empty
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(Array.isArray(stored) ? stored : []);
    } catch {
      window.favorites = new Set();
    }

    // 2️⃣ Ensure saveFavorites exists
    if (typeof window.saveFavorites !== "function") {
      window.saveFavorites = function saveFavorites() {
        try {
          localStorage.setItem("favorites", JSON.stringify([...window.favorites]));
        } catch (e) {
          console.error("❌ Failed to save favorites:", e);
        }
      };
    }

    // 3️⃣ Ensure refreshCards exists
    if (typeof window.refreshCards !== "function") {
      window.refreshCards = function refreshCards() {
        if (!window.assetsData || typeof createAssetCards !== "function") {
          console.warn("⚠️ Cannot refresh cards — assets not ready yet.");
          return;
        }

        const imagePromises = createAssetCards(window.assetsData || []);

        // Trigger optional UI modules if available
        if (typeof renderPage === "function") renderPage();
        if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();

        return imagePromises;
      };
    }

    console.log("✅ Favorites initialized:", [...window.favorites]);
  };

  // --- Loading text helper ---
  window.showLoading = function showLoading(text) {
    const { loaderText, preloader, container } = window.dom || {};

    if (loaderText) {
      loaderText.textContent = text;
    } else if (preloader) {
      preloader.textContent = text;
      preloader.style.textAlign = "center";
    } else if (container) {
      console.warn("⚠️ Preloader elements missing — using container for loading text.");
      container.textContent = text;
      container.style.textAlign = "center";
    } else {
      console.warn("⚠️ No element available to show loading text:", text);
    }
  };

  // --- Ensure preloader DOM bindings exist ---
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      if (!window.dom) window.dom = {};
      const dom = window.dom;

      const preloader = document.getElementById("preloader");
      if (!preloader) return;

      let loaderText = preloader.querySelector(".load-progress-text");
      let progressFill = preloader.querySelector(".load-progress-fill");
      let loaderImage =
        document.getElementById("loaderImage") ||
        preloader.querySelector("img#loaderImage");

      // Create placeholders if missing
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

      // Attach to global dom for other modules
      dom.preloader = preloader;
      dom.loaderText = loaderText;
      dom.progressBarFill = progressFill;
      if (loaderImage) dom.loaderImage = loaderImage;

      console.log("✅ Preloader elements bound to dom:", dom);
    },
    { once: true }
  );

  // --- Auto-init favorites when DOM is ready ---
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      if (!window.favorites) window.initFavorites();
    },
    { once: true }
  );
})();
