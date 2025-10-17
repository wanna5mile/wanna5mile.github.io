document.addEventListener("DOMContentLoaded", async () => {
  initElements();
  initFavorites();
  initPreloader();
  initPaging();
  initPlaceholders();
  await loadAssets();
});