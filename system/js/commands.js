let devConsole;
let typedBuffer = "";
const secretWord = "debugplz!";

// === Detect "debugplz!" typed anywhere ===
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

// === Spawn the admin console ===
function spawnDevConsole() {
  devConsole = document.createElement("div");
  devConsole.id = "devConsole";
  Object.assign(devConsole.style, {
    position: "fixed",
    bottom: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.8)",
    padding: "10px",
    borderRadius: "8px",
    zIndex: "9999",
  });

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter command…";
  Object.assign(input.style, {
    width: "300px",
    padding: "6px",
    fontFamily: "monospace",
    color: "lime",
    background: "black",
    border: "1px solid lime",
    outline: "none",
  });

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

set:theme(name or number)
  → Apply a theme manually from themes.css
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

  // === CLOSE console ===
  if (input === "close") {
    if (devConsole) {
      devConsole.remove();
      devConsole = null;
    }
    return;
  }

  // === THEME SET COMMAND ===
  if (input.startsWith("set:theme")) {
    const themePart = input.match(/\(([^)]+)\)/);
    let themeValue = themePart ? themePart[1].trim().toLowerCase() : input.split(":")[2]?.trim();

    if (!themeValue) {
      alert("Usage: set:theme(name) — Example: set:theme(classic) or set:theme(3)");
      return;
    }

    // Map numbers to theme names
    const themeMap = {
      "1": "classic",
      "2": "midnight",
      "3": "neon",
      "4": "sunset",
      "5": "ocean",
      "6": "retro",
      "7": "forest",
      "8": "void",
      "9": "dream",
      "10": "custom",
    };

    const themeName = themeMap[themeValue] || themeValue;

    if (typeof setTheme === "function") {
      setTheme(themeName);
      console.log(`[Console] Theme manually set to "${themeName}".`);
    } else {
      alert("Theme function unavailable. Make sure settings.js is loaded first.");
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
        if (setting.split(":")[1].trim() === "random") randomPos = true;
      } else if (!isNaN(parseInt(setting))) {
        count = parseInt(setting);
      }
    });

    for (let i = 0; i < count; i++) showGif(filename, randomPos);
    return;
  }

  console.log("Unknown command:", input);
}

// === Simple one-line marquee ===
function showMarquee(text) {
  let wrapper = document.createElement("div");
  wrapper.className = "overlay marquee";
  Object.assign(wrapper.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    background: "rgba(0,0,0,0.8)",
    color: "yellow",
    fontFamily: "monospace",
    padding: "5px",
    zIndex: "9999",
  });
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
  Object.assign(wrapper.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "40px",
    background: "rgba(0,0,0,0.8)",
    overflow: "hidden",
    zIndex: "9999",
    display: "flex",
    alignItems: "center",
  });

  const quoteBox = document.createElement("div");
  quoteBox.id = "commandQuoteBox";
  Object.assign(quoteBox.style, {
    whiteSpace: "nowrap",
    color: "yellow",
    fontFamily: "monospace",
    fontSize: "18px",
  });

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
  Object.assign(el.style, {
    position: "fixed",
    width: "100px",
    zIndex: "9999",
  });

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
