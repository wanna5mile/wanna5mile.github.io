// ✅ loader.js — synced with assets.js Google Sheets API version
async function loadAssets(retry = false) {
  // --- Wait until DOM and preloader ready ---
  if (!window.dom || !dom.preloader) {
    console.warn("DOM or preloader not ready, retrying...");
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
    // === Fetch Data from Google Apps Script ===
    const APPS_SCRIPT_API_URL = "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec";
    const res = await fetch(APPS_SCRIPT_API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

    let assetData;
    try {
      assetData = await res.json();
    } catch (jsonErr) {
      const text = await res.text();
      throw new Error("Invalid JSON returned by Apps Script:\n" + text);
    }

    // --- Create cards + preload images ---
    const imagePromises = createAssetCards(assetData);
    const total = imagePromises.length;
    let loaded = 0;

    // --- Update progress as each image resolves ---
    for (const { promise } of imagePromises) {
      promise.then(() => {
        loaded++;
        const percent = Math.round((loaded / total) * 100);
        updateProgress(percent);
      });
    }

    // --- Wait for all images and overlays ---
    await Promise.allSettled(imagePromises.map(p => p.promise));
    updateProgress(100);

    // --- Small delay for smooth transition ---
    await delay(400);

    // --- Hide loader + finalize ---
    if (typeof refreshCards === "function") refreshCards();
    hidePreloader(true);

  } catch (err) {
    console.error("Error loading assets:", err);

    if (!retry) {
      console.warn("Retrying asset load...");
      return setTimeout(() => loadAssets(true), 1000);
    }

    // --- Handle fatal failure ---
    showLoading("⚠ Failed to load asset data.");
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
    progressBar.setAttribute("aria-valuenow", percent);
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
