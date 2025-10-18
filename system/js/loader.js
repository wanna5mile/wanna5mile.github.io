// ✅ loader.js (cleaned and simplified)
async function loadAssets(retry = false) {
  // --- Safety checks: wait until dependencies are ready ---
  if (!window.dom || !dom.preloader) {
    console.warn("DOM or preloader not ready, retrying...");
    setTimeout(() => loadAssets(retry), 200);
    return;
  }

  if (typeof updateProgress !== "function" || typeof hidePreloader !== "function") {
    console.warn("Preloader functions not ready, retrying...");
    setTimeout(() => loadAssets(retry), 200);
    return;
  }

  // --- Main loader logic ---
  const { loaderImage, preloader, progressText, progressBar } = dom || {};
  if (!preloader) {
    console.warn("Preloader not found in DOM.");
    return;
  }

  // Set initial loading state
  showLoading("Loading assets...");
  if (loaderImage) loaderImage.src = `${config.gifBase}loading.gif`;
  updateProgress(0);

  try {
    const res = await fetch(config.jsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    window.assetsData = await res.json();

    // Create cards and collect image load promises
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

    // Wait for all images to fully load
    await Promise.all(imagePromises.map((p) => p.promise));

    // Ensure 100% is displayed
    updateProgress(100);

    // Short delay for smoother animation
    await new Promise((r) => setTimeout(r, 400));

    // Transition out
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

// --- Helper functions ---
function showLoading(text) {
  const { loaderText } = dom || {};
  if (loaderText) loaderText.textContent = text;
  else console.warn("Loader text element missing");
}

function updateProgress(percent) {
  const { progressText, progressBar } = dom || {};
  if (progressText) progressText.textContent = `${percent}%`;
  if (progressBar) progressBar.style.width = `${percent}%`;
}
