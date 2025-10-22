function initPreloader() {
  const { preloader, loaderImage } = dom;
  if (!preloader) {
    console.warn("⚠ Preloader element not found.");
    return;
  }

  // Prevent duplicates
  if (preloader.dataset.initialized === "true") return;
  preloader.dataset.initialized = "true";

  // --- Elements ---
  const progressText = document.createElement("div");
  const progressBar = document.createElement("div");
  const progressBarFill = document.createElement("div");

  progressText.className = "load-progress-text";
  progressBar.className = "load-progress-bar";
  progressBarFill.className = "load-progress-fill";
  progressBar.appendChild(progressBarFill);
  preloader.append(progressText, progressBar);

  // --- State ---
  const state = { currentPercent: 0 };
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  // --- Progress updater ---
  window.updateProgress = (percent) => {
    if (typeof percent !== "number" || !isFinite(percent)) return;
    state.currentPercent = Math.min(Math.max(percent, 0), 100);
    progressText.textContent = `Loading ${state.currentPercent}%`;
    progressBarFill.style.width = `${state.currentPercent}%`;

    if (state.currentPercent >= 100) {
      setTimeout(async () => {
        await cyclePreloaderGifs(true);
        hidePreloader();
      }, 300);
    }
  };

  // --- Cycle GIFs during load / error ---
  window.cyclePreloaderGifs = async (success = true) => {
    if (!loaderImage) return;
    const gifs = success
      ? [
          `${config.gifBase}loading.gif`,
          `${config.gifBase}load-fire.gif`,
        ]
      : [
          `${config.gifBase}loading.gif`,
          `${config.gifBase}crash.gif`,
          `${config.gifBase}ded.gif`,
        ];

    for (const gif of gifs) {
      loaderImage.src = gif;
      await delay(success ? 1200 : 1300);
    }
  };

  // --- Hide preloader (on success or skip) ---
  window.hidePreloader = (force = false) => {
    if (!preloader || (preloader.dataset.hidden === "true" && !force)) return;
    preloader.dataset.hidden = "true";

    preloader.style.transition = "opacity 0.5s ease";
    preloader.style.opacity = "0";
    preloader.style.pointerEvents = "none";

    setTimeout(() => {
      preloader.style.display = "none";
    }, 500);
  };

  // --- Link Sheets loading progress ---
  // Called automatically from loadAssets() that uses Sheets API
  window.bindSheetsProgress = (promise) => {
    let progress = 0;
    const update = (val) => updateProgress(Math.round(val));

    promise.then(
      () => update(100),
      () => cyclePreloaderGifs(false)
    );

    // Optional: simulate smooth progress while data loads
    const interval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 5;
        update(progress);
      } else if (preloader.dataset.hidden === "true") {
        clearInterval(interval);
      }
    }, 150);

    promise.finally(() => clearInterval(interval));
  };
}
