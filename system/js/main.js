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

  // Allow DOM rendering to complete
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Finish preloader sequence
  await cyclePreloaderGifs(true);
  updateProgress(100);
  hidePreloader();

  // -----------------------------------------
  // PAGE RESTORE LOGIC
  // -----------------------------------------
  const savedPage = sessionStorage.getItem("currentPage");

  if (!savedPage) {
    // First visit in this session → default to page 1
    goToPage(1);
  } else {
    // Restore last visited page
    goToPage(Number(savedPage));
  }
}
