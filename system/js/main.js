document.addEventListener("DOMContentLoaded", async () => {
  initElements();
  initFavorites();
  initPreloader();
  initPaging();
  initPlaceholders();

  try {
    await startLoadingProcess();
  } catch (err) {
    console.error("Fatal load error:", err);
    if (typeof updateProgress === "function") updateProgress(100);
  }
});

// Unified sequence
async function startLoadingProcess() {
  updateProgress(5);

  // Fetch all assets from Sheets (or JSON fallback)
  const assets = await loadAssets();
  updateProgress(60);

  // Wait until all assets/cards are rendered into DOM
  await new Promise((resolve) => requestAnimationFrame(resolve));
  updateProgress(90);

  // Now everything is ready: finish loader
  await cyclePreloaderGifs(true);
  updateProgress(100);
  hidePreloader();

  // Finally: show the first page (e.g. BTD5 or page 1)
  goToPage("btd5", 1);
}
