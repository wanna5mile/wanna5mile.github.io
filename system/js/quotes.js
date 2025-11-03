document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("quoteWrapper");
  const quoteBox = document.getElementById("quoteBox");
  if (!wrapper || !quoteBox) return;

  const jsonPath = "system/json/quotes.json"; // keep or swap for Sheets endpoint
  let quotes = [];

  // --- Animation state ---
  let baseSpeed = 120; // px/sec
  let targetMultiplier = 1;
  let currentMultiplier = 1;
  let position;
  let lastTime = null;
  let paused = false;

  // --- Load quotes (with optional preloader) ---
  async function loadQuotes() {
    showLoading?.("Loading quotes...");
    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch quotes: ${res.status}`);
      const data = await res.json();

      quotes = Array.isArray(data) && data.length ? data : ["No quotes available."];
      initQuotes();
      hidePreloader?.();
    } catch (err) {
      console.error("Error loading quotes:", err);
      quotes = ["⚠ Failed to load quotes."];
      initQuotes();
      hidePreloader?.(true);
    }
  }

  // --- Pick and position a random quote ---
  function setRandomQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteBox.textContent = randomQuote;

    // start just off the right edge of the wrapper
    position = wrapper.offsetWidth + 10;
    quoteBox.style.transform = `translateX(${position}px)`;
  }

  // --- Main animation loop ---
  function animate(timestamp) {
    if (lastTime !== null) {
      const delta = (timestamp - lastTime) / 1000;
      const accel = 2; // responsiveness of speed changes

      currentMultiplier += (targetMultiplier - currentMultiplier) * accel * delta;

      if (!paused) {
        position -= baseSpeed * currentMultiplier * delta;
        quoteBox.style.transform = `translateX(${position}px)`;
      }

      // Wait until the entire quote is *completely* offscreen
      if (position < -quoteBox.offsetWidth - 20) {
        setRandomQuote();
      }
    }

    lastTime = timestamp;
    requestAnimationFrame(animate);
  }

  // --- Hover slowdowns ---
  wrapper.addEventListener("mouseenter", () => (targetMultiplier = 0.8));
  wrapper.addEventListener("mouseleave", () => (targetMultiplier = 1));
  quoteBox.addEventListener("mouseenter", () => (targetMultiplier = 0.4));
  quoteBox.addEventListener("mouseleave", () => (targetMultiplier = 1));

  // --- Mouse hold pauses ---
  function pause() {
    paused = true;
    quoteBox.style.cursor = "grabbing";
  }
  function unpause() {
    paused = false;
    quoteBox.style.cursor = "grab";
  }

  wrapper.addEventListener("mousedown", pause);
  quoteBox.addEventListener("mousedown", pause);
  window.addEventListener("mouseup", unpause);

  // --- Initialize ---
  function initQuotes() {
    setRandomQuote();
    requestAnimationFrame(animate);
  }

  // Start
  loadQuotes();
});
