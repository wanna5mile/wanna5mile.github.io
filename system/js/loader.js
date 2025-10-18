// --- main-loader.js ---
async function loadAssets(retry = false) {
  // Defensive lookup for DOM elements
  const { loaderImage, preloader, progressText, container } = dom || {};
  if (!preloader) {
    console.warn("Preloader not found in DOM.");
    return;
  }

  showLoading("Loading assets...");

  if (loaderImage) loaderImage.src = `${config.gifBase}loading.gif`;
  updateProgress(0);

  try {
    const res = await fetch(config.jsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    window.assetsData = await res.json();

    // Create cards and collect promises
    const imagePromises = createAssetCards(assetsData);
    renderPage();
    startPlaceholderCycle();

    const total = imagePromises.length;
    let loaded = 0;

    for (const { promise } of imagePromises) {
      promise.then(() => {
        loaded++;
        const percent = Math.round((loaded / total) * 100);
        updateProgress(percent);
      });
    }

    // Wait for all images to load
    await Promise.all(imagePromises.map((p) => p.promise));

    // Make sure progress reaches 100%
    updateProgress(100);

    // Delay slightly to ensure animation completes
    await new Promise((r) => setTimeout(r, 400));

    // Transition preloader out
    await cyclePreloaderGifs(true);
    hidePreloader(true);
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
  const { loaderText } = dom || {};
  if (loaderText) loaderText.textContent = text;
  else console.warn("Loader text element missing");
}

// --- helper: safe progress ---
function updateProgress(percent) {
  const { progressText, progressBar } = dom || {};
  if (progressText) progressText.textContent = `${percent}%`;
  if (progressBar) progressBar.style.width = `${percent}%`;
}
