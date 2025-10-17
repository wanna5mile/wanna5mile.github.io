function initFavorites() {
  window.favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));
  window.saveFavorites = () =>
    localStorage.setItem("favorites", JSON.stringify([...favorites]));
}