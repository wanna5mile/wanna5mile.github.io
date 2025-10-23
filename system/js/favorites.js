// ---- favorites.js ----
// Handles loading and displaying only starred (favorited) assets.

(() => {
  "use strict";

  // --- Utility ---
  const safeStr = (v) => (v == null ? "" : String(v).trim().toLowerCase());
  const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));

  /* ==========================================================
     FAVORITES INITIALIZATION
     ========================================================== */
  window.initFavorites = function () {
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(Array.isArray(stored) ? stored.map(safeStr) : []);
    } catch {
      window.favorites = new Set();
    }

    window.saveFavorites = function () {
      try {
        localStorage.setItem("favorites", JSON.stringify([...window.favorites]));
      } catch (e) {
        console.error("❌ Failed to save favorites:", e);
      }
    };

    console.log("✅ Favorites ready:", [...window.favorites]);
  };

  /* ==========================================================
     PRELOADER BINDINGS
     ========================================================== */
  window.updateProgress = (p) => {
    const clamped = clamp(p, 0, 100);
    const c = document.getElementById("counter");
    const bar = document.querySelector(".load-progress-fill");
    if (c) c.textContent = `${clamped}%`;
    if (bar) bar.style.width = `${clamped}%`;
  };

  window.showLoading = (txt) => {
    const t = document.querySelector(".loading-text");
    if (t) t.textContent = txt;
  };

  window.hidePreloader = (force = false) => {
    const pre = document.getElementById("preloader");
    if (!pre) return;
    pre.style.transition = "opacity 0.4s ease";
    pre.style.opacity = "0";
    setTimeout(() => (pre.style.display = "none"), 500);
  };

  /* ==========================================================
     MAIN FAVORITES LOADER
     ========================================================== */
  async function loadFavoriteAssets() {
    showLoading("Loading your favorites...");
    updateProgress(10);
    const { sheetUrl } = window.config || {};

    const favList = JSON.parse(localStorage.getItem("favorites") || "[]").map(safeStr);
    const container = document.getElementById("container");

    if (!favList.length) {
      container.innerHTML = `<p class="center-msg">No favorites yet ⭐</p>`;
      return hidePreloader(true);
    }

    // Use cached favorites if available
    const cached = JSON.parse(localStorage.getItem("favoritesCache") || "null");
    if (Array.isArray(cached)) {
      renderFavorites(cached, false);
      hidePreloader(true);
    }

    try {
      const res = await fetch(sheetUrl, { cache: "no-store" });
      const all = await res.json();

      const favAssets = all.filter((a) => favList.includes(safeStr(a.title)));
      const newCache = JSON.stringify(favAssets);
      const oldCache = JSON.stringify(cached);
      if (newCache !== oldCache) {
        localStorage.setItem("favoritesCache", newCache);
        renderFavorites(favAssets, true);
      }
    } catch (err) {
      console.warn("⚠ Offline or failed to refresh favorites:", err);
      if (!cached) {
        container.innerHTML = `<p class="center-msg">Offline — no cached favorites.</p>`;
      }
    }
  }

  /* ==========================================================
     RENDERING FAVORITES ONLY
     ========================================================== */
  function renderFavorites(favAssets, refreshed = false) {
    if (!favAssets?.length) {
      document.getElementById("container").innerHTML =
        `<p class="center-msg">No favorites found.</p>`;
      return;
    }

    const cards = createAssetCards(favAssets);
    let done = 0;
    if (Array.isArray(cards)) {
      cards.forEach(async ({ promise }) => {
        await promise;
        done++;
        updateProgress(Math.floor((done / cards.length) * 100));
      });
    }
    if (refreshed) console.log("🔄 Favorites refreshed");
  }

  /* ==========================================================
     PAGE BOOTSTRAP
     ========================================================== */
  document.addEventListener("DOMContentLoaded", async () => {
    window.initFavorites();

    const wait = setInterval(() => {
      if (typeof createAssetCards === "function" && window.config?.sheetUrl) {
        clearInterval(wait);
        loadFavoriteAssets();
      }
    }, 100);
  });
})();
