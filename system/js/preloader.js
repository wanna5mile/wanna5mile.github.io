function initPreloader() {
  const { preloader } = dom;
  if (!preloader) return;

  // Build DOM
  const progressText = document.createElement("div");
  const progressBar = document.createElement("div");
  const progressFill = document.createElement("div");
  progressText.className = "load-progress-text";
  progressBar.className = "load-progress-bar";
  progressFill.className = "load-progress-fill";
  progressBar.append(progressFill);
  preloader.append(progressText, progressBar);

  // State
  window.preloaderState = { percent: 0 };

  // --- Update function ---
  window.updateProgress = (percent) => {
    preloaderState.percent = Math.min(100, Math.max(0, percent));
    progressText.textContent = `Loading ${Math.floor(preloaderState.percent)}%`;
    progressFill.style.width = `${preloaderState.percent}%`;
  };

  // --- GIF cycling ---
  window.cyclePreloaderGifs = async (success = true) => {
    const { loaderImage } = dom;
    if (!loaderImage) return;

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const gifs = success
      ? [`${config.gifBase}loading.gif`, `${config.gifBase}load-fire.gif`]
      : [`${config.gifBase}loading.gif`, `${config.gifBase}crash.gif`, `${config.gifBase}ded.gif`];

    for (const gif of gifs) {
      loaderImage.src = gif;
      await delay(900);
    }
  };

  // --- Hide preloader ---
  window.hidePreloader = (force = false) => {
    if (!preloader || preloader.dataset.hidden === "true") return;
    preloader.dataset.hidden = "true";
    preloader.style.transition = "opacity 0.5s ease";
    preloader.style.opacity = "0";
    preloader.style.pointerEvents = "none";
    setTimeout(() => (preloader.style.display = "none"), 500);
  };
}
