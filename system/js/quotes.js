document.addEventListener("DOMContentLoaded", () => {
const wrapper = document.getElementById("quoteWrapper");
const box = document.getElementById("quoteBox");
const jsonPath = "https://cdn.jsdelivr.net/gh/wanna5mile/wanna5mile.github.io@main/system/json/quotes.json";
let quotes = [];
let pos = 0;
let lastTime = null;
const baseSpeed = 120;
const slowSpeed = 70;
const slowerSpeed = 30;
let currentSpeed = baseSpeed;
let isHoveringBox = false;
let isHoveringText = false;
let isMouseDown = false;
async function loadQuotes() {
  try {
    const res = await fetch(jsonPath);
    const data = await res.json();
    quotes = Array.isArray(data) && data.length ? data : ["No quotes found"];
    start();
  } catch {
    quotes = ["⚠ Error loading quotes"];
    start();
  }
}
function setQuote() {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  box.textContent = quote;
  pos = wrapper.offsetWidth;
  box.style.transform = `translateX(${pos}px)`;
}
function updateSpeed() {
  if (isMouseDown) currentSpeed = 0;
  else if (isHoveringText) currentSpeed = slowerSpeed;
  else if (isHoveringBox) currentSpeed = slowSpeed;
  else currentSpeed = baseSpeed;
}
function animate(time) {
  if (lastTime !== null) {
    const dt = (time - lastTime) / 1000;
    pos -= currentSpeed * dt;
    box.style.transform = `translateX(${pos}px)`;
    if (pos + box.offsetWidth < 0) setQuote();
  }
  lastTime = time;
  requestAnimationFrame(animate);
}
function start() {
  setQuote();
  requestAnimationFrame(animate);
}
wrapper.addEventListener("mouseenter", () => { isHoveringBox = true; updateSpeed(); });
wrapper.addEventListener("mouseleave", () => { isHoveringBox = false; isHoveringText = false; updateSpeed(); });
box.addEventListener("mouseenter", () => { isHoveringText = true; updateSpeed(); });
box.addEventListener("mouseleave", () => { isHoveringText = false; updateSpeed(); });
wrapper.addEventListener("mousedown", () => { isMouseDown = true; updateSpeed(); });
wrapper.addEventListener("mouseup", () => { isMouseDown = false; updateSpeed(); });
loadQuotes();
});
