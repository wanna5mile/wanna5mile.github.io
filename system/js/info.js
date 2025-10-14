document.addEventListener("DOMContentLoaded", () => {
  const quoteBox = document.getElementById("randomquote");
  const jsonPath = "system/json/info.json"; // adjust if needed
  let quotes = [];
  const changeInterval = 8000; // 8 seconds between quotes

  // Load quotes from JSON
  async function loadQuotes() {
    try {
      const res = await fetch(jsonPath);
      if (!res.ok) throw new Error(`Failed to fetch quotes: ${res.status}`);
      quotes = await res.json();

      if (!Array.isArray(quotes) || quotes.length === 0) {
        quotes = ["No quotes available."];
      }

      startQuotes();
    } catch (err) {
      console.error("Error loading quotes:", err);
      quotes = ["⚠ Failed to load quotes."];
      startQuotes();
    }
  }

  // Pick and display a random quote
  function setRandomQuote() {
    if (quotes.length === 0) return;
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteBox.textContent = randomQuote;
  }

  // Initialize and schedule quote changes
  function startQuotes() {
    setRandomQuote();
    setInterval(setRandomQuote, changeInterval);
  }

  // Start process
  loadQuotes();
});
