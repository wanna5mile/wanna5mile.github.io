document.addEventListener("DOMContentLoaded", () => {
document.body.addEventListener("click", async (e) => {
const a = e.target.closest("a");
if (!a) return;

let href = a.getAttribute("href");
if (!href) return;

if (href.includes("https://wanna5mile.github.io/")) {
  e.preventDefault();
  const fixed = href.replace("https://wanna5mile.github.io/", "https://wanna5mile.github.io./");
  window.open(fixed, a.target || "_blank");
  return;
}

if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return;

const url = new URL(href, window.location.origin);

try {
  const res = await fetch(url.href, { method: "HEAD" });

  if (!res.ok) {
e.preventDefault();
window.location.href = "/404.html";
  }
} catch (err) {
  console.warn(`Network error checking ${url.href}:`, err);
}
  });
});
