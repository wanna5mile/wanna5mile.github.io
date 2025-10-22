document.addEventListener("DOMContentLoaded", async () => {
  initElements();
  initFavorites();
  initPreloader();
  initPaging();
  initPlaceholders();

  try {
    await startLoadingProcess();
  } catch (err) {
    console.error("Startup error:", err);
    await cyclePreloaderGifs(false);
    updateProgress(100);
    hidePreloader(true);
  }
});

async function startLoadingProcess() {
  updateProgress(5);

  // Fetch all assets from Sheets
  const allAssets = await loadAssetsFromSheets();
  updateProgress(60);

  // Create cards for all assets
  await createAssetCards(allAssets);
  updateProgress(85);

  // Allow DOM to finish layout/rendering
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Finish preloader sequence
  await cyclePreloaderGifs(true);
  updateProgress(100);
  hidePreloader();

  // Start at "btd5" page (or fallback to 1)
  goToPage("btd5", 1);
}
