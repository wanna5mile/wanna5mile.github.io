// ---- info.js ----
// Loads random quotes from system/json/info.json and rotates them smoothly.

document.addEventListener("DOMContentLoaded", () => {
  const quoteBox = document.getElementById("randomquote");
  const jsonPath = "system/json/info.json"; // Adjust path if needed
  const changeInterval = 8000; // 8 seconds per quote
  let quotes = [];
  let quoteTimer = null;

  // --- Utility: Smooth fade transition ---
  function fadeReplaceText(element, newText, duration = 500) {
    if (!element) return;
    element.style.transition = `opacity ${duration / 1000}s ease`;
    element.style.opacity = 0;

    setTimeout(() => {
      element.textContent = newText;
      element.style.opacity = 1;
    }, duration);
  }

  // --- Load quotes from JSON ---
  async function loadQuotes() {
    try {
      const res = await fetch(jsonPath, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        quotes = data;
      } else {
        quotes = ["No quotes available."];
      }
    } catch (err) {
      console.error("Error loading quotes:", err);
      quotes = ["⚠ Failed to load quotes."];
    } finally {
      startQuotes();
    }
  }

  // --- Random quote selection ---
  function getRandomQuote() {
    if (quotes.length === 0) return "…";
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  // --- Display and cycle quotes ---
  function showRandomQuote() {
    fadeReplaceText(quoteBox, getRandomQuote());
  }

  function startQuotes() {
    if (!quoteBox) {
      console.warn("Quote element not found: #randomquote");
      return;
    }
    if (quoteTimer) clearInterval(quoteTimer);

    showRandomQuote();
    quoteTimer = setInterval(showRandomQuote, changeInterval);
  }

  // --- Start process ---
  loadQuotes();
});
