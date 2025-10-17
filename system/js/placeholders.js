function initPlaceholders() {
  const { searchInput } = dom;
  if (!searchInput) return;
  window.fadePlaceholder = (input, text, cb) => {
    input.classList.add("fade-out");
    setTimeout(() => {
      input.placeholder = text;
      input.classList.remove("fade-out");
      input.classList.add("fade-in");
      setTimeout(() => {
        input.classList.remove("fade-in");
        cb && cb();
      }, 400);
    }, 400);
  };
  window.startPlaceholderCycle = () => {
    const loop = () => {
      const visible = getFilteredCards().filter(
        (c) => parseInt(c.dataset.page) === window.currentPage
      ).length;
      fadePlaceholder(searchInput, `${visible} assets on this page`, () => {
        setTimeout(() => {
          fadePlaceholder(searchInput, "Search assets...", () =>
            setTimeout(loop, 4000)
          );
        }, 4000);
      });
    };
    loop();
  };
}