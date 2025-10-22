// ✅ loader.js — Unified + Optimized Google Sheets Loader
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

  // --- Initialize UI ---
  showLoading("Loading assets...");
  if (loaderImage) loaderImage.src = `${config.gifBase}loading.gif`;
  updateProgress(0);

  try {
    // --- Fetch from Google Sheets Web App ---
    const SHEET_URL =
      "https://script.google.com/macros/s/AKfycbzw69RTChLXyis4xY9o5sUHtPU32zaMeKaR2iEliyWBsJFvVbTbMvbLNfsB4rO4gLLzTQ/exec";

    const res = await fetch(SHEET_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid data format from Sheets");

    const total = data.length;
    let loaded = 0;
    const allData = [];

    // --- Stage through each record for smoother progress ---
    for (const entry of data) {
      allData.push(entry);
      loaded++;
      const percent = 10 + Math.floor((loaded / total) * 70);
      updateProgress(percent);
      if (loaded % 15 === 0)
        await new Promise((r) => requestAnimationFrame(r));
    }

    // --- Stop early if we reached “BTD5 page 1” ---
    const stopIndex = allData.findIndex(
      (item) =>
        item.title?.toLowerCase().includes("btd5") &&
        String(item.page) === "1"
    );
    const finalData =
      stopIndex !== -1 ? allData.slice(0, stopIndex + 1) : allData;

    // --- Create asset cards + preload images ---
    const imagePromises = createAssetCards(finalData);
    const imgTotal = imagePromises.length;
    let imgLoaded = 0;

    for (const { promise } of imagePromises) {
      promise.then(() => {
        imgLoaded++;
        const percent = 80 + Math.round((imgLoaded / imgTotal) * 20);
        updateProgress(percent);
      });
    }

    // --- Wait for all images and smooth transition ---
    await Promise.allSettled(imagePromises.map((p) => p.promise));
    updateProgress(100);
    await delay(400);

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
