function initPlaceholders() {
  const { searchInput } = dom;
  if (!searchInput) return;

  const FADE_DURATION = 400;
  const HOLD_DURATION = 4000;

  // --- Smooth placeholder transition ---
  window.fadePlaceholder = (input, text, cb) => {
    if (!input) return;
    input.classList.add("fade-out");

    setTimeout(() => {
      input.placeholder = text;
      input.classList.remove("fade-out");
      input.classList.add("fade-in");

      setTimeout(() => {
        input.classList.remove("fade-in");
        if (typeof cb === "function") cb();
      }, FADE_DURATION);
    }, FADE_DURATION);
  };

  // --- Placeholder cycle animation ---
  window.startPlaceholderCycle = () => {
    let cycleActive = false;

    const loop = () => {
      if (cycleActive) return;
      cycleActive = true;

      if (typeof getFilteredCards !== "function") {
        console.warn("⚠ getFilteredCards() not found. Skipping placeholder cycle.");
        return;
      }

      const visible = getFilteredCards().filter(
        (c) => parseInt(c.dataset.page, 10) === window.currentPage
      ).length;

      fadePlaceholder(searchInput, `${visible} assets on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search assets...", () => {
            cycleActive = false;
            setTimeout(loop, HOLD_DURATION);
          });
        }, HOLD_DURATION);
      });
    };

    loop();
  };
}
