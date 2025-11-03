let devConsole;
let typedBuffer = "";
const secretWord = "admin";

// === Detect "admin" typed anywhere ===
document.addEventListener("keydown", (e) => {
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    typedBuffer += e.key.toLowerCase();

    // Keep buffer only as long as the secret word
    if (typedBuffer.length > secretWord.length) {
      typedBuffer = typedBuffer.slice(-secretWord.length);
    }

    if (typedBuffer === secretWord && !devConsole) {
      spawnDevConsole();
      typedBuffer = ""; // reset buffer
    }
  }
});

// === Console spawn ===
function spawnDevConsole() {
  devConsole = document.createElement("div");
  devConsole.id = "devConsole";
  devConsole.style.position = "fixed";
  devConsole.style.bottom = "10px";
  devConsole.style.left = "50%";
  devConsole.style.transform = "translateX(-50%)";
  devConsole.style.background = "rgba(0,0,0,0.8)";
  devConsole.style.padding = "10px";
  devConsole.style.borderRadius = "8px";
  devConsole.style.zIndex = "9999";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter command…";
  input.style.width = "300px";
  input.style.padding = "6px";
  input.style.fontFamily = "monospace";
  input.style.color = "lime";
  input.style.background = "black";
  input.style.border = "1px solid lime";
  input.style.outline = "none";

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleCommand(input.value);
      input.value = "";
    }
  });

  devConsole.appendChild(input);
  document.body.appendChild(devConsole);
  input.focus();
}

// === Command handler ===
function handleCommand(input) {
  input = input.trim();

  // === HELP ===
  if (input === ":help:" || input === "commands") {
    alert(`
=== Available Commands ===

:help: or commands
  → Show this list

:clear:
  → Clear overlays (gifs, marquees, etc.)

:clear-all:
  → Clear everything including console

close
  → Close the admin console only

marquee
  → Start rotating random marquee quotes

marquee: Hello world;
  → Start custom marquee with your text

gif
  → Spawn demo gif

gif-flappy.gif:3,set-position:random;
  → Spawn 3 gifs randomly placed
`);
    return;
  }

  // === CLEAR commands ===
  if (input === ":clear:") {
    document.querySelectorAll(".overlay").forEach(el => el.remove());
    return;
  }
  if (input === ":clear-all:") {
    document.querySelectorAll(".overlay, #devConsole").forEach(el => el.remove());
    devConsole = null;
    return;
  }

  // === CLOSE command (new) ===
  if (input === "close") {
    if (devConsole) {
      devConsole.remove();
      devConsole = null;
    }
    return;
  }

  // === MARQUEE commands ===
  if (input === "marquee") {
    startCommandMarquee();
    return;
  }
  if (input.startsWith("marquee:")) {
    const text = input.split(":")[1].replace(";", "").trim();
    showMarquee(text);
    return;
  }

  // === GIF commands ===
  if (input === "gif") {
    showGif("https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif");
    return;
  }
  if (input.startsWith("gif-")) {
    const [gifPart, settingsPart] = input.split(":");
    const filename = gifPart.replace("gif-", "").trim();
    const settings = settingsPart ? settingsPart.replace(";", "").split(",") : [];

    let count = 1;
    let randomPos = false;

    settings.forEach(setting => {
      if (setting.includes("set-position")) {
        if (setting.split(":")[1].trim() === "random") {
          randomPos = true;
        }
      } else if (!isNaN(parseInt(setting))) {
        count = parseInt(setting);
      }
    });

    for (let i = 0; i < count; i++) {
      showGif(filename, randomPos);
    }
    return;
  }

  console.log("Unknown command:", input);
}

// === Simple one-line marquee ===
function showMarquee(text) {
  let wrapper = document.createElement("div");
  wrapper.className = "overlay marquee";
  wrapper.style.position = "fixed";
  wrapper.style.top = "0";
  wrapper.style.left = "0";
  wrapper.style.width = "100%";
  wrapper.style.background = "rgba(0,0,0,0.8)";
  wrapper.style.color = "yellow";
  wrapper.style.fontFamily = "monospace";
  wrapper.style.padding = "5px";
  wrapper.style.zIndex = "9999";
  wrapper.textContent = text;
  document.body.appendChild(wrapper);

  wrapper.animate(
    [{ transform: "translateX(100%)" }, { transform: "translateX(-100%)" }],
    { duration: 10000, iterations: Infinity, easing: "linear" }
  );
}

// === Advanced rotating marquee ===
function startCommandMarquee() {
  if (document.getElementById("commandMarquee")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "commandMarquee";
  wrapper.className = "overlay";
  wrapper.style.position = "fixed";
  wrapper.style.top = "0";
  wrapper.style.left = "0";
  wrapper.style.width = "100%";
  wrapper.style.height = "40px";
  wrapper.style.background = "rgba(0,0,0,0.8)";
  wrapper.style.overflow = "hidden";
  wrapper.style.zIndex = "9999";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";

  const quoteBox = document.createElement("div");
  quoteBox.id = "commandQuoteBox";
  quoteBox.style.whiteSpace = "nowrap";
  quoteBox.style.color = "yellow";
  quoteBox.style.fontFamily = "monospace";
  quoteBox.style.fontSize = "18px";
  wrapper.appendChild(quoteBox);
  document.body.appendChild(wrapper);

  const quotes = [
    "slackrr now bg.uhm", "jouyuss now bg.uhm",
    "v1 release on sept 26th 2025", "POKEMON NOW WORKING!!!",
    "join the discord! https://discord.gg/vskTb44F5j",
    "Support Selenite and contributors on Sources/credits page or Github!",
    "one for all.", "all for one.", "24 songs, 76 projects.",
    "i make music too!", "smash karts is working fine idk what jayden is on about.",
    "cloak is gonna be fixed soon...", "genizy genius",
    "click the arrows to view more projects!", "page 2 is gonna be added on friday!",
    "no way its a week before release T-T", "im so cooked bro.", "page one is finished!",
    "ddlc soon??", "pokemon green version soon??",
    "login and sign up is NOT gonna happen any time soon ✌",
    "you think v1 gonna come out on time?", "should probably get more people to help me on the website..",
    "choppy orc da best music", "MUSIC NOW WORKING!!", "fixed music page :D",
    "math aint make no sense. oh wait nvm i think i get it.",
    "dont search blank you will find a mob of angry git octocats!"
  ];

  let baseSpeed = 120;
  let targetMultiplier = 1;
  let currentMultiplier = 1;
  let position;
  let lastTime = null;
  let paused = false;

  function setRandomQuote() {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteBox.textContent = randomQuote;
    position = wrapper.offsetWidth + 50;
    quoteBox.style.transform = `translateX(${position}px)`;
  }

  function animate(timestamp) {
    if (lastTime !== null) {
      const delta = (timestamp - lastTime) / 1000;
      const accel = 2;
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

  wrapper.addEventListener("mouseenter", () => { targetMultiplier = 0.8; });
  wrapper.addEventListener("mouseleave", () => { targetMultiplier = 1; });
  wrapper.addEventListener("mousedown", () => { paused = true; });
  window.addEventListener("mouseup", () => { paused = false; });

  setRandomQuote();
  requestAnimationFrame(animate);
}

// === GIF spawner ===
function showGif(filename, randomPos = false) {
  let el = document.createElement("img");
  el.className = "overlay gif";
  el.src = filename;
  el.style.position = "fixed";
  el.style.width = "100px";
  el.style.zIndex = "9999";

  if (randomPos) {
    el.style.left = Math.floor(Math.random() * (window.innerWidth - 100)) + "px";
    el.style.top = Math.floor(Math.random() * (window.innerHeight - 100)) + "px";
  } else {
    el.style.left = "50%";
    el.style.top = "50%";
    el.style.transform = "translate(-50%, -50%)";
  }

  document.body.appendChild(el);
}
