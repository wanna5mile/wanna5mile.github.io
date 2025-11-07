/* ==========================================================
   Quotes Scroller (JSON-Fetched, Smoothed, Centered & Fixed)
   ========================================================== */
async function initQuotes() {
  const wrapper = document.getElementById("quoteWrapper");
  const quoteBox = document.getElementById("quoteBox");
  if (!wrapper || !quoteBox) return;

  try {
    const res = await fetch(config.quotesJson, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch quotes JSON");
    const quotes = await res.json();

    if (!Array.isArray(quotes) || !quotes.length)
      throw new Error("Invalid quotes format");

    // === Core animation settings ===
    let baseSpeed = 120; // pixels per second
    let targetMultiplier = 1;
    let currentMultiplier = 1;
    let position = 0;
    let lastTime = null;
    let paused = false;

    // --- Helper: pick and display a random quote ---
    function setRandomQuote() {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      quoteBox.textContent = randomQuote;

      // Wait one frame so the new width is known
      requestAnimationFrame(() => {
        const offset = 50 + Math.random() * 100; // slight random delay offscreen
        position = wrapper.offsetWidth + offset;
        quoteBox.style.transform = `translate(${position}px, -50%)`;
      });
    }

    // --- Main animation loop ---
    function animate(timestamp) {
      if (lastTime !== null) {
        const delta = (timestamp - lastTime) / 1000; // seconds since last frame
        const accel = 5; // faster response for hover transitions

        // Smoothly interpolate only if not paused
        const target = paused ? 0 : targetMultiplier;
        currentMultiplier += (target - currentMultiplier) * accel * delta;

        // Only move if not paused
        if (!paused && currentMultiplier > 0.001) {
          position -= baseSpeed * currentMultiplier * delta;
          quoteBox.style.transform = `translate(${position}px, -50%)`;
        }

        // ✅ Wait until fully off-screen before resetting
        if (position + quoteBox.offsetWidth < -100) {
          setRandomQuote();
        }
      }

      lastTime = timestamp;
      requestAnimationFrame(animate);
    }

    // --- Hover speed adjustments ---
    wrapper.addEventListener("mouseenter", () => (targetMultiplier = 0.5));
    wrapper.addEventListener("mouseleave", () => (targetMultiplier = 1));
    quoteBox.addEventListener("mouseenter", () => (targetMultiplier = 0.25));
    quoteBox.addEventListener("mouseleave", () => (targetMultiplier = 1));

    // --- Pause/resume on mousedown ---
    const pause = () => {
      paused = true;
      currentMultiplier = 0; // instantly stop motion
    };
    const unpause = () => {
      paused = false;
    };

    wrapper.addEventListener("mousedown", pause);
    quoteBox.addEventListener("mousedown", pause);
    window.addEventListener("mouseup", unpause);

    // --- Initialize first quote & start animation ---
    setRandomQuote();
    requestAnimationFrame(animate);
    console.log("✅ Quotes loaded successfully");
  } catch (err) {
    console.warn("⚠ Quotes init failed:", err);
  }
}
