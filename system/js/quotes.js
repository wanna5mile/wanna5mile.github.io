  /* ---------------------------
     Quotes Scroller (JSON-Fetched)
     --------------------------- */
  async function initQuotes() {
    const wrapper = document.getElementById("quoteWrapper");
    const quoteBox = document.getElementById("quoteBox");
    if (!wrapper || !quoteBox) return;

    try {
      const res = await fetch(config.quotesJson, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch quotes JSON");
      const quotes = await res.json();

      if (!Array.isArray(quotes) || !quotes.length) throw new Error("Invalid quotes format");

      let baseSpeed = 120;
      let targetMultiplier = 1;
      let currentMultiplier = 1;
      let position;
      let lastTime = null;
      let paused = false;

      function setRandomQuote() {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteBox.textContent = randomQuote;
        position = wrapper.offsetWidth + 50;
        quoteBox.style.transform = `translateX(${position}px)`;
      }

      function animate(timestamp) {
        if (lastTime !== null) {
          const delta = (timestamp - lastTime) / 1000;
          const accel = 2;
          currentMultiplier += (targetMultiplier - currentMultiplier) * accel * delta;

          if (!paused) {
            position -= baseSpeed * currentMultiplier * delta;
            quoteBox.style.transform = `translateX(${position}px)`;
          }

          if (position + quoteBox.offsetWidth < 0) setRandomQuote();
        }
        lastTime = timestamp;
        requestAnimationFrame(animate);
      }

      wrapper.addEventListener("mouseenter", () => (targetMultiplier = 0.8));
      wrapper.addEventListener("mouseleave", () => (targetMultiplier = 1));
      quoteBox.addEventListener("mouseenter", () => (targetMultiplier = 0.4));
      quoteBox.addEventListener("mouseleave", () => (targetMultiplier = 1));

      const pause = () => (paused = true);
      const unpause = () => (paused = false);
      wrapper.addEventListener("mousedown", pause);
      quoteBox.addEventListener("mousedown", pause);
      window.addEventListener("mouseup", unpause);

      setRandomQuote();
      requestAnimationFrame(animate);
      console.log("✅ Quotes loaded successfully");
    } catch (err) {
      console.warn("⚠ Quotes init failed:", err);
    }
  }
