(() => {
  const body = document.body;
  let bgImage = null;
  let imgNaturalWidth = 0;
  let imgNaturalHeight = 0;

  let viewportHeight = 0;
  let scrollRange = 0;
  let scaledImageHeight = 0;
  let maxOffset = 0;

  let ticking = false;

  function getBackgroundUrl() {
    const bg = getComputedStyle(body)
      .getPropertyValue("--main-bg")
      .trim();

    if (!bg || bg === "none") return null;

    if (bg.startsWith("url")) {
      return bg.replace(/url\(["']?(.*?)["']?\)/, "$1");
    }

    return null;
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  }

  function recalc() {
    viewportHeight = window.innerHeight;

    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    scrollRange = Math.max(1, docHeight - viewportHeight);

    // match your CSS: min(1365px, 100vw)
    const displayWidth = Math.min(1365, window.innerWidth);
    const scale = displayWidth / imgNaturalWidth;

    scaledImageHeight = imgNaturalHeight * scale;
    maxOffset = Math.max(0, scaledImageHeight - viewportHeight);

    update();
  }

  function update() {
    const scrollY = window.scrollY;
    const progress = Math.min(1, scrollY / scrollRange);
    const offsetY = progress * maxOffset;

    body.style.backgroundPosition = `top center`;
    body.style.backgroundPositionY = `${-offsetY}px`;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }

  async function init() {
    const url = getBackgroundUrl();
    if (!url) return;

    bgImage = await loadImage(url);
    imgNaturalWidth = bgImage.naturalWidth;
    imgNaturalHeight = bgImage.naturalHeight;

    recalc();
  }

  // Watch for theme changes (attribute-based)
  const observer = new MutationObserver(() => {
    init();
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["theme"]
  });

  window.addEventListener("resize", recalc);
  window.addEventListener("scroll", onScroll);
  window.addEventListener("load", init);
})();
