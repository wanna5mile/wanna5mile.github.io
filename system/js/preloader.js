function initPreloader() {
  const { preloader } = dom;
  const progressText = document.createElement("div");
  const progressBar = document.createElement("div");
  const progressBarFill = document.createElement("div");
  progressText.className = "load-progress-text";
  progressBar.className = "load-progress-bar";
  progressBarFill.className = "load-progress-fill";
  progressBar.appendChild(progressBarFill);
  preloader.append(progressText, progressBar);
  window.preloaderState = { currentPercent: 0 };
  window.updateProgress = (percent) => {
    preloaderState.currentPercent = percent;
    progressText.textContent = `Loading ${percent}%`;
    progressBarFill.style.width = `${percent}%`;
    if (percent >= 100) {
      setTimeout(async () => {
        await cyclePreloaderGifs(true);
        hidePreloader();
      }, 200);
    }
  };
  window.cyclePreloaderGifs = async (success = true) => {
    const { loaderImage } = dom;
    if (!loaderImage) return;
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const gifs = success
      ? [`${config.gifBase}loading.gif`, `${config.gifBase}load-fire.gif`]
      : [`${config.gifBase}loading.gif`, `${config.gifBase}crash.gif`, `${config.gifBase}ded.gif`];
    for (const gif of gifs) {
      loaderImage.src = gif;
      await delay(success ? 1200 : 1300);
    }
  };
  window.hidePreloader = (force = false) => {
    if (!preloader || (preloader.dataset.hidden === "true" && !force)) return;
    preloader.dataset.hidden = "true";
    preloader.classList.add("fade");
    preloader.style.transition = "opacity 0.5s ease";
    setTimeout(() => {
      preloader.style.opacity = "0";
      preloader.style.pointerEvents = "none";
      preloader.style.display = "none";
    }, 500);
  };
}