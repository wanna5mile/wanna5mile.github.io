// ✅ loader.js — unified and duplicate-free
async function loadAssets(retry = false) {
  // --- Wait until DOM + preloader ready ---
  if (!window.dom || !dom.preloader) {
    console.warn("DOM or preloader not ready, retrying...");
    return setTimeout(() => loadAssets(retry), 200);
  }

  if (typeof updateProgress !== "function" || typeof hidePreloader !== "function") {
    console.warn("Preloader functions not ready, retrying...");
    return setTimeout(() => loadAssets(retry), 200);
  }

  const { loaderImage, preloader, progressText, progressBar } = dom || {};
  if (!preloader) {
    console.warn("Preloader not found in DOM.");
    return;
  }

  // --- Initialize loading state ---
  showLoading("Loading assets...");
  if (loaderImage) loaderImage.src = `${config.gifBase}loading.gif`;
  updateProgress(0);

  try {
    // --- Fetch JSON ---
    const res = await fetch(config.jsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    window.assetsData = await res.json();

    // --- Create cards + preload images ---
    const imagePromises = createAssetCards(assetsData);
    renderPage();
    startPlaceholderCycle();

    const total = imagePromises.length;
    let loaded = 0;

    // --- Update progress as images load ---
    for (const { promise } of imagePromises) {
      promise.then(() => {
        loaded++;
        const percent = Math.round((loaded / total) * 100);
        updateProgress(percent);
      });
    }

    // --- Wait for all images to load ---
    await Promise.all(imagePromises.map((p) => p.promise));

    // --- Ensure completion ---
    updateProgress(100);

    // --- Smooth animation delay ---
    await delay(400);

    // --- Transition to loaded state ---
    await cyclePreloaderGifs(true);
    hidePreloader(true);

  } catch (err) {
    console.error("Error loading JSON:", err);

    if (!retry) {
      console.warn("Retrying asset load...");
      return setTimeout(() => loadAssets(true), 1000);
    }

    // --- Handle fatal failure ---
    showLoading("⚠ Failed to load asset data.");
    await cyclePreloaderGifs(false);
    hidePreloader(true);
  }
}

// --- Helpers ---
function showLoading(text) {
  const { loaderText } = dom || {};
  if (loaderText) loaderText.textContent = text;
}

function updateProgress(percent) {
  const { progressText, progressBar } = dom || {};
  if (progressText) progressText.textContent = `${percent}%`;
  if (progressBar) {
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute("aria-valuenow", percent); // accessibility
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
