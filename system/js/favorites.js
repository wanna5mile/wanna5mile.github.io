/* ==========================================================
   WannaSmile | Standalone Favorites System
   Extracted + Clean Version
========================================================== */

(() => {
  "use strict";

  const safeStr = (v) => (v == null ? "" : String(v));

  /* ---------------------------
     Load + Initialize Favorites
  --------------------------- */
  function loadFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      window.favorites = new Set(stored.map((s) => safeStr(s).toLowerCase()));
    } catch {
      window.favorites = new Set();
    }
  }

  /* ---------------------------
     Save
  --------------------------- */
  window.saveFavorites = () => {
    localStorage.setItem("favorites", JSON.stringify([...window.favorites]));
  };

  /* ---------------------------
     Helper: Is Favorite?
  --------------------------- */
  window.isFav = (title) =>
    window.favorites.has(safeStr(title).toLowerCase());

  /* ---------------------------
     Toggle Favorite
  --------------------------- */
  window.toggleFavorite = (title) => {
    const key = safeStr(title).toLowerCase();
    if (window.favorites.has(key)) {
      window.favorites.delete(key);
    } else {
      window.favorites.add(key);
    }
    saveFavorites();

    // Allow the UI to refresh
    if (typeof window.refreshCards === "function") {
      window.refreshCards();
    }
  };

  /* ---------------------------
     Initialize on Load
  --------------------------- */
  loadFavorites();
})();
