const toTopBtn = document.getElementById("toTopBtn");
window.addEventListener("scroll", () => {
const scrollY = window.scrollY;
if (scrollY > 250) {
toTopBtn.classList.add("show");
} else {
toTopBtn.classList.remove("show");
}
});

toTopBtn.addEventListener("click", () => {
window.scrollTo({
top: 0,
behavior: "smooth"
});
});
