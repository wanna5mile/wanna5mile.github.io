// ✅ loader.js — Final Unified Google Sheets Loader (safe, smooth, complete)
async function loadAssets(retry = false) {
  // --- Ensure DOM and preloader exist before starting ---
  if (!window.dom || !dom.preloader) {
    console.warn("DOM or preloader not ready, retrying...");
    return setTimeout(() => loadAssets(retry), 200);
  }

  const { loaderImage, preloader } = dom || {};
  if (!preloader) {
    console.warn("Preloader not found in DOM.");
    return;
  }

  // --- Initialize preloader UI ---
  showLoading("Loading assets...");
  if (loaderImage) loaderImage.src = `${config.gifBase}loading.gif`;
  updateProgress(0);

  try {
    // --- Fetch from Google Sheets Web App ---
    const SHEET_URL =
      "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec";

    const res = await fetch(SHEET_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);

    // --- Parse data safely ---
    let rawData;
    try {
      rawData = await res.json();
    } catch (jsonErr) {
      const text = await res.text();
      throw new Error("Invalid JSON returned by Sheets:\n" + text);
    }

    if (!Array.isArray(rawData)) throw new Error("Invalid data format from Sheets");

    // --- Filter out only completely blank rows, keep partial ones ---
    const data = rawData.filter(
      (item) => item && Object.values(item).some((v) => v && String(v).trim() !== "")
    );

    const total = data.length;
    let loaded = 0;
    const stagedData = [];

    // --- Smooth staged loading for progress feedback ---
    for (const entry of data) {
      stagedData.push(entry);
      loaded++;
      const percent = 10 + Math.floor((loaded / total) * 70);
      updateProgress(percent);
      if (loaded % 15 === 0) await new Promise((r) => requestAnimationFrame(r));
    }

    // --- Generate asset cards and preload their images ---
    const imagePromises = createAssetCards(stagedData);
    const imgTotal = imagePromises.length;
    let imgLoaded = 0;

    for (const { promise } of imagePromises) {
      promise.then(() => {
        imgLoaded++;
        const percent = 80 + Math.round((imgLoaded / imgTotal) * 20);
        updateProgress(percent);
      });
    }

    // --- Wait for all image preloads ---
    await Promise.allSettled(imagePromises.map((p) => p.promise));
    updateProgress(100);

    // --- Smooth fade-out delay ---
    await delay(400);

    // --- Finalize UI and display assets ---
    if (typeof refreshCards === "function") refreshCards();
    hidePreloader(true);

  } catch (err) {
    console.error("Error loading assets:", err);

    if (!retry) {
      console.warn("Retrying asset load...");
      return setTimeout(() => loadAssets(true), 1000);
    }

    showLoading("⚠ Failed to load asset data.");
    await cyclePreloaderGifs(false);
    hidePreloader(true);
  }
}

/* -----------------------------
 * Helpers
 * ----------------------------- */
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
