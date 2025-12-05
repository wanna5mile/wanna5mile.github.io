document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
        nextPage();
    }
    if (e.key === "ArrowLeft") {
        prevPage();
    }
});
