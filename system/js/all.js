/* ==========================================================
   ASSET LOADER (Google Sheets) — Waits for All Images
   ========================================================== */
async function loadAssets(retry = false) {
  if (!window.dom || !dom.preloader) {
    console.warn("DOM/preloader not ready, retrying...");
    return setTimeout(() => loadAssets(retry), 200);
  }

  showLoading("Loading assets...");
  updateProgress(5);

  try {
    // === 1. Fetch Data ===
    const res = await fetch(config.sheetUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);

    const rawData = await res.json();
    if (!Array.isArray(rawData)) throw new Error("Invalid data from Sheets");

    const data = rawData.filter(
      (item) => item && Object.values(item).some((v) => v && String(v).trim() !== "")
    );
    window.assetsData = data;

    // === 2. Stage Data Progressively ===
    const total = data.length;
    let loaded = 0;
    const stagedData = [];

    for (const entry of data) {
      stagedData.push(entry);
      loaded++;
      updateProgress(10 + Math.floor((loaded / total) * 50));
      if (loaded % 15 === 0) await new Promise((r) => requestAnimationFrame(r));
    }

    // === 3. Create Cards and Gather Image Promises ===
    const imagePromises = createAssetCards(stagedData);
    if (!Array.isArray(imagePromises) || imagePromises.length === 0)
      throw new Error("No image promises created");

    const imgTotal = imagePromises.length;
    let imgLoaded = 0;

    // Track progress as each image resolves or fails
    for (const { promise } of imagePromises) {
      promise.finally(() => {
        imgLoaded++;
        const pct = 60 + Math.floor((imgLoaded / imgTotal) * 40);
        updateProgress(Math.min(pct, 99)); // Never hit 100 until after wait
      });
    }

    // === 4. Wait for ALL to Finish ===
    await Promise.allSettled(imagePromises.map((p) => p.promise));
    updateProgress(100);

    // === 5. Ensure Minimum Display Time ===
    await new Promise((r) => setTimeout(r, 700)); // smooth transition

    // === 6. Finish ===
    hidePreloader(true);
    if (typeof renderPage === "function") renderPage();
    if (typeof startPlaceholderCycle === "function") startPlaceholderCycle();

    console.log("✅ All assets and images loaded successfully");
  } catch (err) {
    console.error("Error loading assets:", err);

    if (!retry) {
      console.warn("Retrying asset load...");
      return setTimeout(() => loadAssets(true), 1000);
    }

    showLoading("⚠ Failed to load assets.");
    await cyclePreloaderGifs(false);
    updateProgress(100);
    await new Promise((r) => setTimeout(r, 1000));
    hidePreloader(true);
  }
}
