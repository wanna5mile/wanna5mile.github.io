    const quotes = [
      "slackrr now bg.uhm",
      "jouyuss now bg.uhm",
      "v1 release on sept 26th 2025",
      "POKEMON NOW WORKING!!!",
      "join the discord! https://discord.gg/vskTb44F5j",
      "Support Selenite and contributors on Sources/credits page or Github!",
      "one for all.",
      "all for one.",
      "24 songs, 76 projects.",
      "i make music too!",
      "smash karts is working fine idk what jayden is on about.",
      "cloak is gonna be fixed soon...",
      "genizy genius",
      "click the arrows to view more projects!",
      "page 2 is gonna be added on friday!",
      "no way its a week before release T-T",
      "im so cooked bro.",
      "page one is finished!",
      "ddlc soon??",
      "pokemon green version soon??",
      "login and sign up is NOT gonna happen any time soon ✌",
      "you think v1 gonna come out on time?",
      "should probably get more people to help me on the website..",
      "choppy orc da best music",
      "MUSIC NOW WORKING!!",
      "fixed music page :D",
      "math aint make no sense. oh wait nvm i think i get it.",
      "dont search blank you will find a mob of angry git octocats!"
    ];

    const wrapper = document.getElementById("quoteWrapper");
    const quoteBox = document.getElementById("quoteBox");

    let baseSpeed = 120; // px per second
    let targetMultiplier = 1; // where we WANT to go
    let currentMultiplier = 1; // where we ARE now
    let position;
    let lastTime = null;
    let paused = false;

    function setRandomQuote() {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      quoteBox.textContent = randomQuote;
      // Start off-screen right (plus extra for long text)
      position = wrapper.offsetWidth + 50;
      quoteBox.style.transform = `translateX(${position}px)`;
    }

    function animate(timestamp) {
      if (lastTime !== null) {
        const delta = (timestamp - lastTime) / 1000;

        // Smoothly ease currentMultiplier toward targetMultiplier
        const accel = 2; // higher = faster adjustment
        currentMultiplier += (targetMultiplier - currentMultiplier) * accel * delta;

        if (!paused) {
          position -= baseSpeed * currentMultiplier * delta;
          quoteBox.style.transform = `translateX(${position}px)`;
        }

        // Reset when fully left
        if (position + quoteBox.offsetWidth < 0) {
          setRandomQuote();
        }
      }
      lastTime = timestamp;
      requestAnimationFrame(animate);
    }

// Hover effects
wrapper.addEventListener("mouseenter", () => { targetMultiplier = 0.8; }); // 20% slower
wrapper.addEventListener("mouseleave", () => { targetMultiplier = 1; });   // normal
quoteBox.addEventListener("mouseenter", () => { targetMultiplier = 0.4; }); // 80% slower
quoteBox.addEventListener("mouseleave", () => { targetMultiplier = 1; });   // back to normal

    // Pause on hold (mousedown/up)
    function pause() { paused = true; }
    function unpause() { paused = false; }

    wrapper.addEventListener("mousedown", pause);
    quoteBox.addEventListener("mousedown", pause);
    window.addEventListener("mouseup", unpause);

    // Init
    setRandomQuote();
    requestAnimationFrame(animate);
