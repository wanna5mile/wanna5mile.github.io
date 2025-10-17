async function loadAssets(retry = false) {
  const { loaderImage } = dom;
  showLoading("Loading assets...");
  if (loaderImage) loaderImage.src = `${config.gifBase}loading.gif`;
  updateProgress(0);
  try {
    const res = await fetch(config.jsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    window.assetsData = await res.json();
    const imagePromises = createAssetCards(assetsData);
    renderPage();
    startPlaceholderCycle();
    const total = imagePromises.length;
    let loaded = 0;
    imagePromises.forEach(({ promise }) => {
      promise.then(() => {
        loaded++;
        const percent = Math.round((loaded / total) * 100);
        updateProgress(percent);
      });
    });
    await Promise.all(imagePromises.map((p) => p.promise));
  } catch (err) {
    console.error("Error loading JSON:", err);
    if (!retry) {
      setTimeout(() => loadAssets(true), 1000);
    } else {
      showLoading("⚠ Failed to load asset data.");
      await cyclePreloaderGifs(false);
      hidePreloader(true);
    }
  }
}
function showLoading(text) {
  const { container } = dom;
  container.textContent = text;
  container.style.textAlign = "center";
}