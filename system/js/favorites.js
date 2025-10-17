// --- FAVORITES SYSTEM ---
// Must load before assets.js
(function () {
  // Safely load from localStorage
  function loadFavorites() {
    try {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      if (Array.isArray(stored)) return new Set(stored);
    } catch (e) {
      console.warn("Favorites data corrupted, resetting.");
    }
    return new Set();
  }

  // Global favorites state
  window.favorites = loadFavorites();

  // Save favorites back to localStorage
  window.saveFavorites = function () {
    try {
      localStorage.setItem("favorites", JSON.stringify([...favorites]));
    } catch (e) {
      console.error("Failed to save favorites:", e);
    }
  };

  // Optional: expose a clear/reset method
  window.clearFavorites = function () {
    favorites.clear();
    localStorage.removeItem("favorites");
    console.log("Favorites cleared");
  };

  // Optional: initialize log for debugging
  console.log(`Favorites loaded (${favorites.size})`, [...favorites]);
})();
