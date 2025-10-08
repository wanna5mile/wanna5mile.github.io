document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.getElementById("quoteWrapper");
  const quoteBox = document.getElementById("quoteBox");

  const jsonPath = "system/json/quotes.json"; // or adjust path
  let quotes = [];

  let baseSpeed = 120; // px per second
  let targetMultiplier = 1; // where we WANT to go
  let currentMultiplier = 1; // where we ARE now
  let position;
  let lastTime = null;
  let paused = false;

  // Fetch quotes.json
  async function loadQuotes() {
    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch quotes: ${res.status}`);
      quotes = await res.json();

      if (!Array.isArray(quotes) || quotes.length === 0) {
        quotes = ["No quotes available."];
      }

      initQuotes();
    } catch (err) {
      console.error("Error loading quotes:", err);
      quotes = ["⚠ Failed to load quotes."];
      initQuotes();
    }
  }

  // Set random quote
  function setRandomQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteBox.textContent = randomQuote;
    position = wrapper.offsetWidth + 50; // start off-screen right
    quoteBox.style.transform = `translateX(${position}px)`;
  }

  // Animation loop
  function animate(timestamp) {
    if (lastTime !== null) {
      const delta = (timestamp - lastTime) / 1000;

      const accel = 2; // higher = faster adjustment
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

  // Hover and pause controls
  wrapper.addEventListener("mouseenter", () => { targetMultiplier = 0.8; });
  wrapper.addEventListener("mouseleave", () => { targetMultiplier = 1; });
  quoteBox.addEventListener("mouseenter", () => { targetMultiplier = 0.4; });
  quoteBox.addEventListener("mouseleave", () => { targetMultiplier = 1; });

  function pause() { paused = true; }
  function unpause() { paused = false; }

  wrapper.addEventListener("mousedown", pause);
  quoteBox.addEventListener("mousedown", pause);
  window.addEventListener("mouseup", unpause);

  // Initialize once quotes load
  function initQuotes() {
    setRandomQuote();
    requestAnimationFrame(animate);
  }

  // Start it all
  loadQuotes();
});
