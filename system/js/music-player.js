/***********************
 * music-player.js
 * Merged/updated version:
 * - preserves original variable names
 * - supports per-track cover art
 * - creates .vinyl (rotating) + .cover (static) inside .track-art
 * - last track uses a different cover (maybe.png)
 ***********************/

/* DOM references (kept same as your original) */
let now_playing = document.querySelector('.now-playing');
let track_art = document.querySelector('.track-art');
let track_name = document.querySelector('.track-name');
let track_artist = document.querySelector('.track-artist');

let playpause_btn = document.querySelector('.playpause-track');
let next_btn = document.querySelector('.next-track');
let prev_btn = document.querySelector('.prev-track');

let seek_slider = document.querySelector('.seek_slider');
let volume_slider = document.querySelector('.volume_slider');
let curr_time = document.querySelector('.current-time');
let total_duration = document.querySelector('.total-duration');
let wave = document.getElementById('wave');
let randomIcon = document.querySelector('.fa-random');
let curr_track = document.createElement('audio');

let track_index = 0;
let isPlaying = false;
let isRandom = false;
let updateTimer;

/* ---- Web Audio API setup ---- */
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let analyser = audioCtx.createAnalyser();
let source = audioCtx.createMediaElementSource(curr_track);
source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 256;
let bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);

/* helper: ensure .vinyl and .cover exist inside .track-art */
let discEl, coverEl;
function ensureArtChildren() {
  if (!track_art) return;
  discEl = track_art.querySelector('.vinyl');
  coverEl = track_art.querySelector('.cover');

  // Create disc (rotates) if missing
  if (!discEl) {
    discEl = document.createElement('div');
    discEl.className = 'disc';
    // let CSS control appearance; insert as first child (beneath cover)
    track_art.insertBefore(discEl, track_art.firstChild);
  }

  // Create cover (top, static) if missing
  if (!coverEl) {
    coverEl = document.createElement('div');
    coverEl.className = 'cover';
    track_art.appendChild(coverEl);
  }
}

/* call once on load */
ensureArtChildren();

/* Animate wave (simple scaleY approach like before) */
function renderWave() {
  requestAnimationFrame(renderWave);
  if (isPlaying) {
    analyser.getByteFrequencyData(dataArray);
    let volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    if (wave) {
      wave.style.display = "block";
      wave.style.transform = `scaleY(${Math.max(0.25, volume / 100)})`;
    }
  } else {
    if (wave) wave.style.display = "none";
  }
}
renderWave();

/* ---- Music list (per-track cover allowed) ---- */
const basePath = "./system/music/albums/die-lit";
const coverDefault = "";

/* You can add a `cover` property per track to override the default cover.
   The last track below deliberately has a different cover file "maybe.png". */
const music_list = [
  { name: "1", file: ""   { name: "", file: "" },
  { name: "2", file: "" },
  { name: "3", file: "" },
  { name: "4", file: "" },
  { name: "5", file: "" },
  { name: "6", file: "" },
  { name: "7", file: "" },
  { name: "8", file: "" },
  { name: "9", file: "" },
  { name: "10", file: "" },
  { name: "11", file: "" },
  { name: "12", file: "" },
  { name: "13", file: "" },
  { name: "14", file: "" },
  { name: "15", file: "" },

  /* last track overrides cover to maybe.png (relative path to your repo) */
  { name: "16", file: "", cover: "" }
].map(track => ({
  img: track.cover || coverDefault,     // per-track cover or fallback
  name: track.name,
  artist: track.artist || "playboi carti",
  music: basePath + track.file
}));

/* ---- Player functions (kept same behavior, updated for disc/cover) ---- */
loadTrack(track_index);
document.body.style.background = "#222";

function loadTrack(index) {
  clearInterval(updateTimer);
  reset();

  // Bound check
  if (index < 0) index = 0;
  if (index >= music_list.length) index = music_list.length - 1;

  curr_track.src = music_list[index].music;
  curr_track.load();

  // Ensure art children exist (in case HTML changed after load)
  ensureArtChildren();

  // Set cover art on the .cover element
  if (coverEl) coverEl.style.backgroundImage = `url("${music_list[index].img}")`;

  // (Optional) allow a 'disc' visual per-track (not required). If you add a 'disc' property later,
  // you could set discEl.style.backgroundImage = `url("${music_list[index].vinyl}")`
  track_name.textContent = music_list[index].name;
  track_artist.textContent = music_list[index].artist;
  now_playing.textContent = `Playing music ${index + 1} of ${music_list.length}`;

  updateTimer = setInterval(setUpdate, 1000);
  curr_track.addEventListener('ended', nextTrack);
}

function reset() {
  curr_time.textContent = "00:00";
  total_duration.textContent = "00:00";
  seek_slider.value = 0;
}

function randomTrack() {
  isRandom ? pauseRandom() : playRandom();
}
function playRandom() {
  isRandom = true;
  if (randomIcon) randomIcon.classList.add('randomActive');
}
function pauseRandom() {
  isRandom = false;
  if (randomIcon) randomIcon.classList.remove('randomActive');
}
function repeatTrack() {
  loadTrack(track_index);
  playTrack();
}
function playpauseTrack() {
  isPlaying ? pauseTrack() : playTrack();
}
function playTrack() {
  // resume audio context for autoplay policies
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  curr_track.play().catch(err => {
    // Autoplay blocked — user interaction required. Silently ignore here.
    // You could show a notice prompting user to click to start.
    // console.warn('Playback failed (autoplay policy):', err);
  });

  isPlaying = true;

  // rotate the disc element (not the cover) so the cover stays static
  if (discEl) discEl.classList.add('rotate');
  playpause_btn.innerHTML = '<i class="fa fa-pause-circle fa-5x"></i>';
}
function pauseTrack() {
  curr_track.pause();
  isPlaying = false;
  if (discEl) discEl.classList.remove('rotate');
  playpause_btn.innerHTML = '<i class="fa fa-play-circle fa-5x"></i>';
}
function nextTrack() {
  if (track_index < music_list.length - 1 && !isRandom) {
    track_index++;
  } else if (track_index < music_list.length - 1 && isRandom) {
    track_index = Math.floor(Math.random() * music_list.length);
  } else {
    track_index = 0;
  }
  loadTrack(track_index);
  playTrack();
}
function prevTrack() {
  track_index = track_index > 0 ? track_index - 1 : music_list.length - 1;
  loadTrack(track_index);
  playTrack();
}
function seekTo() {
  if (!curr_track.duration) return;
  let seekto = curr_track.duration * (seek_slider.value / 100);
  curr_track.currentTime = seekto;
}
function setVolume() {
  curr_track.volume = (volume_slider && volume_slider.value) ? volume_slider.value / 100 : 1;
}
function setUpdate() {
  if (!isNaN(curr_track.duration)) {
    let seekPosition = curr_track.currentTime * (100 / curr_track.duration);
    seek_slider.value = seekPosition;

    let currentMinutes = Math.floor(curr_track.currentTime / 60);
    let currentSeconds = Math.floor(curr_track.currentTime % 60);
    let durationMinutes = Math.floor(curr_track.duration / 60);
    let durationSeconds = Math.floor(curr_track.duration % 60);

    if (currentSeconds < 10) currentSeconds = "0" + currentSeconds;
    if (durationSeconds < 10) durationSeconds = "0" + durationSeconds;
    if (currentMinutes < 10) currentMinutes = "0" + currentMinutes;
    if (durationMinutes < 10) durationMinutes = "0" + durationMinutes;

    curr_time.textContent = `${currentMinutes}:${currentSeconds}`;
    total_duration.textContent = `${durationMinutes}:${durationSeconds}`;
  }
}

/* Optional: if you want click handlers in JS instead of inline onclick attributes */
// playpause_btn && playpause_btn.addEventListener('click', playpauseTrack);
// next_btn && next_btn.addEventListener('click', nextTrack);
// prev_btn && prev_btn.addEventListener('click', prevTrack);
