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

  // --- Load quotes (with preloader integration) ---
  async function loadQuotes() {
    showLoading?.("Loading quotes...");

    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch quotes: ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length) {
        quotes = data;
      } else {
        quotes = ["No quotes available."];
      }

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

    // reset position to right of screen
    position = wrapper.offsetWidth + 50;
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

      if (position + quoteBox.offsetWidth < 0) {
        setRandomQuote();
      }
    }

    lastTime = timestamp;
    requestAnimationFrame(animate);
  }

  // --- Controls ---
  const hoverSlowdown = (m) => () => (targetMultiplier = m);
  wrapper.addEventListener("mouseenter", hoverSlowdown(0.8));
  wrapper.addEventListener("mouseleave", hoverSlowdown(1));
  quoteBox.addEventListener("mouseenter", hoverSlowdown(0.4));
  quoteBox.addEventListener("mouseleave", hoverSlowdown(1));

  wrapper.addEventListener("mousedown", () => (paused = true));
  window.addEventListener("mouseup", () => (paused = false));

  // --- Initialize ---
  function initQuotes() {
    setRandomQuote();
    requestAnimationFrame(animate);
  }

  // Start
  loadQuotes();
});
