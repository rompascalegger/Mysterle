"use strict";
// MYSTERLE: the game is to understand the game.
// A pool of 100 layers. Every day the date picks 12 of them, in rising difficulty, and
// rolls their details (numbers, words, colors, positions) plus 3 daily anomalies, so no
// two mysteries are the same. One attempt per day, resumable. After that: the abyss,
// which goes through all 100.
//
// This file is the engine. The layers live in layers-*.js and register with def().

const VERSION = "2.0.0";
const $ = (id) => document.getElementById(id);

// ---------- small helpers ----------
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (sec) => {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0");
};
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function shuffleWith(arr, r) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const ONES = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE",
  "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
function numWord(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : "");
  return String(n);
}
const NUMVAL = {};
for (let i = 0; i < 100; i++) NUMVAL[numWord(i)] = i;

// ---------- the daily mystery ----------
const EPOCH = Date.UTC(2026, 10, 7); // 7 Nov 2026 is mystery #1
function mysteryNumber() {
  const d = new Date();
  return Math.max(1, Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000) + 1);
}
const NUM = mysteryNumber();
const DAY_RNG = mulberry32(hashStr("mysterle-day-" + NUM));
const DAILY_TIERS = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5];
const NAME_ADJ = ["VELVET", "HOLLOW", "INVERTED", "WHISPERING", "SEVENTH", "UPSIDE-DOWN", "MOTH-EATEN", "ENDLESS", "QUIET",
  "BORROWED", "SLEEPING", "ROTATING", "PAPER", "GLASS", "LOUD", "FORGOTTEN", "CROOKED", "LUMINOUS", "DOUBLE", "MISSING",
  "BACKWARDS", "WET", "HUMMING", "UNFINISHED"];
const NAME_NOUN = ["STAIRCASE", "LIGHTHOUSE", "ARCHIVE", "CARNIVAL", "HALLWAY", "AQUARIUM", "ORCHESTRA", "LIBRARY", "MACHINE",
  "GARDEN", "ELEVATOR", "CATHEDRAL", "TELEPHONE", "MIRROR", "SUNDAY", "HOTEL", "RADIO", "THEATER", "LABYRINTH", "KITCHEN",
  "WAITING ROOM", "MUSEUM", "TIDE", "DREAM"];
const DAY_NAME = "THE " + pick(NAME_ADJ, DAY_RNG) + " " + pick(NAME_NOUN, DAY_RNG);
const ANOMALIES = {
  double: "DOUBLE VISION", wander: "WANDERING SENTENCE", clock: "LYING CLOCK", voice: "A VOICE",
  fall: "FALLING NOISE", mirror: "MIRROR MOMENTS", ghosts: "GHOSTS", eyerain: "EYE RAIN", slant: "SLANTED WORDS",
  stutter: "STUTTER", endings: "FAKE ENDINGS", tears: "SCREEN TEARS",
};
const ANOMS = new Set(shuffleWith(Object.keys(ANOMALIES), DAY_RNG).slice(0, 3));

// ---------- text pools ----------
const PHRASES = ["WHY?", "IT'S FINE", "LOADING 147%", "ERROR: MEANING NOT FOUND", "DON'T LOOK", "LOOK", "are you sure?", "↻",
  "→", "← NOT THIS", "THE RULES CHANGED", "CORRECT", "INCORRECT", "???", "you're close", "you're not close", "BREATHE",
  "IT SEES YOU", "ALMOST", "NEVER", "LEVEL UP?", "SIGNAL LOST", "∞", "PRESS NOTHING", "WAIT", "FASTER", "SLOWER",
  "this is not a hint", "THIS IS A HINT", "404", "OK", "hmm", "bzzt", "REMAIN CALM", "UNDERSTAND?", "YES", "NO", "maybe",
  "YOU ARE HERE", "WRONG WAY", "PLEASE HOLD", "↑↑↓↓", "SCORE: -3", "+1", "NEW RULE", "OLD RULE", "IGNORE THIS",
  "DID YOU SEE THAT?", "AGAIN", "AND AGAIN", "SYSTEM CALM", "hello?", "!!!", "SEVEN", "TOO LATE", "NOT YET", "WAS?",
  "warum", "¿QUÉ?", "pourquoi", "it's behind you", "you dropped something", "the floor is listening", "DO NOT BLINK",
  "t̷h̷e̷ ̷e̷y̷e̷", "Z̴̢A̷L̶G̵O̶", "ERR_SOUL_TIMEOUT", "TUESDAY", "you were here before", "nobody pressed that", "CTRL+Z",
  "THE MOTH KNOWS", "please stand by", "↺ REWINDING", "LAYER ∞", "DÉJÀ VU", "ready?", "not ready", "BEEP"];
const GLYPHS = ["✶", "☉", "⌘", "◬", "⟁", "⧗", "☍", "✺", "⌬", "⍟", "◈", "⊛", "☊", "♒", "⚘", "⌖", "⟡", "⊗", "▲", "●",
  "■", "◆", "✦", "☽", "⚡", "✖", "⌀", "∴", "⋈", "⎔", "☄", "⚙", "♜", "☿", "♆", "𓂀", "◉", "⏚", "⌇", "⍾"];
const FAKE_BTNS = ["CONTINUE", "OK", "SKIP ▶", "CLICK", "NEXT", "HELP", "UNDO", "START", "YES", "NO", "?", "RESET", "SOLVE",
  "ACCEPT", "WIN", "CANCEL", "RETRY", "DOWNLOAD MORE RULES"];
const RETORTS = ["NO.", "WRONG BUTTON", "THANK YOU", "+1 ???", "NICE TRY", "THAT DID NOTHING", "THAT DID SOMETHING", "OUCH",
  "✓", "✗", "AGAIN?", "HA", "NOTED.", "REPORTED.", "...", "WHY", "SAVED (NOT)", "UNDONE", "SOMEWHERE, A DOOR CLOSED"];
const BAR_LABELS = ["installing doubt", "loading rules", "updating reality", "deleting hints", "counting eyes", "buffering",
  "compiling silence", "unloading meaning", "defragmenting you", "rewinding tuesday"];
const WIN_TITLES = ["SYSTEM", "Mysterle.exe", "WARNING", "NOTICE", "error", "C:\\RULES", "reality.dll", "THE EYE"];
const WIN_TEXT = ["Everything is fine.", "The rules have been updated.", "Are you still there?", "Do not trust the windows.",
  "This window is not important.", "A hint was found and deleted.", "Meaning could not be loaded.",
  "Press OK to continue nothing.", "Your understanding is 87% complete.", "The sentence has been informed.",
  "Something blinked.", "Please do not read this."];
const LIE_WORDS = ["NOTHING", "YOU", "LIE", "WAIT", "DON'T", "ALWAYS", "NEVER", "EAT", "HELP", "???", "RUN", "BLUE", "ME",
  "LATER", "MOTH", "BEHIND", "SLEEP"];
const LIES = ["YOU ARE DOING GREAT", "THIS IS FINE", "THE RULES HAVE CHANGED", "IGNORE ME", "WRONG SENTENCE",
  "LOOK BEHIND YOU", "THIS WAS NEVER HERE", "YOU ALREADY WON"];
const TITLE_GLITCH = ["MYSTERLE", "MY5TERLE", "M?STERLE", "ᴍʏsᴛᴇʀʟᴇ", "M Y S T E R L E", "▒▒▒▒▒▒▒▒", "ELRETSYM", "MYSTER…"];
const VOICE_LINES = ["do not trust the eye", "you are doing it wrong", "almost", "it is behind the words", "listen",
  "the rules are made of words", "again", "who taught you that", "you have been here before", "it is fine", "keep going"];
const TICKER_A = "WELCOME TO MYSTERLE ✶ NOTHING IS WRONG ✶ PLEASE REMAIN CONFUSED ✶ THE RULES HAVE BEEN UPDATED ✶ YOUR PROGRESS IS BEING WATCHED ✶ DO NOT READ THIS TICKER ✶ TODAY'S FORECAST: EYES ✶ THE SENTENCE IS ALWAYS RIGHT ✶ THE SENTENCE IS NEVER RIGHT ✶ ";
const TICKER_B = "0x3F ◬ 7 ⟁ 12 ⧗ 9.81 ☉ ERR ⌬ 404 ✺ 1/∞ ⌘ 33 ◈ NULL ⊛ 2+2=5 ☍ 07:77 ⍟ 88 ⟡ ?? ✶ 101 ⊗ ";

// ---------- shapes and colors ----------
const COLORS = { RED: "#ff2a3d", BLUE: "#2f7bff", GREEN: "#2bff88", YELLOW: "#ffe23a", PINK: "#ff4fd8" };
const COLOR_KEYS = Object.keys(COLORS);
const SHAPE_OF = { SQUARES: "square", CIRCLES: "circle", TRIANGLES: "tri", EYES: "eye", STARS: "star" };

// ---------- DOM ----------
const cv = $("cv"), ctx = cv.getContext("2d");
const bar = $("bar"), floatLayer = $("floaters"), popsEl = $("pops"), whisperEl = $("whisper"), typedEl = $("typed");
const meterEl = $("meter"), ringEl = $("m-ring"), irisEl = $("m-iris"), pupilEl = $("m-pupil"), smallEl = $("small");
const timerEl = $("timer"), pipsEl = $("pips"), revealEl = $("reveal"), flashEl = $("flash"), veilEl = $("veil");
const cursorEl = $("cursor"), countdownEl = $("countdown"), bigEyeEl = $("bigeye"), bigIrisEl = $("be-iris");
const fakeEndEl = $("fakeend");
const RING_C = 2 * Math.PI * 54;

// ---------- state ----------
const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const S = {
  clock: 0, started: false, running: false, ended: false, test: false,
  mode: "daily", seq: [], idx: 0, cycle: 0, runClock: 0, saveT: 0,
  L: null, clicks: 0, changes: 0, hints: 0, hintLevel: 0, perHints: [],
  calm: store.get("mysterle-calm", reducedMotion), muted: store.get("mysterle-muted", false),
  px: innerWidth / 2, py: innerHeight / 2, pointerType: "mouse", lastMove: 0, lastInput: 0, dragging: false,
  down: null, dragObj: null,
  speed: 1, worldSpeed: 1, worldRot: 0, worldRotT: 0, worldScale: 1, worldScaleT: 1, worldHidden: false, worldFlipX: 1,
  skyMode: "NORMAL", skyColor: null, calmProx: 0, boost: 0, noise: 1, hue: 260, hueJump: 0, sigRot: 0,
  mp: 0, lastP: 0, flashA: 0, cursorMode: null, cx: 0, cy: 0, dark: 0,
  stutterT: 0, tearT: 0, clockLieT: 0, mirrorT: 0, voiceT: 40,
};
const now = () => S.clock;
let W = innerWidth, H = innerHeight, DPR = 1;
const objs = [], parts = [], rings = [], trail = [];
const swirl = Array.from({ length: 140 }, () => ({
  a: rand(0, 6.283), R: rand(0.04, 1), w: rand(0.1, 0.9) * (Math.random() < 0.5 ? -1 : 1),
  s: rand(1, 3.5), h: rand(0, 120), al: rand(0.25, 0.9),
}));
const ghosts = Array.from({ length: 3 }, (_, i) => ({ lag: 0.4 + i * 0.35, ox: rand(-160, 160), oy: rand(-120, 120) }));

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  cv.style.width = W + "px"; cv.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (const o of objs) { o.x = clamp(o.x, o.r, W - o.r); o.y = clamp(o.y, o.r, H - o.r); }
  if (S.L && S.L.def.onResize) S.L.def.onResize(S.L);
}
window.addEventListener("resize", resize);
resize();

// ---------- sound (Web Audio, no files) ----------
const Snd = {
  ctx: null, master: null, droneG: null, drones: [], progO: null, progG: null, noiseBuf: null,
  droneLevel: 1, dronePitch: 1, base: [55, 82.6, 110.7],
  init() {
    if (this.ctx) { if (this.ctx.resume) this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      const c = this.ctx = new C();
      this.master = c.createGain(); this.master.gain.value = S.muted ? 0 : 0.55; this.master.connect(c.destination);
      const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420; f.Q.value = 6;
      this.droneG = c.createGain(); this.droneG.gain.value = 0;
      f.connect(this.droneG); this.droneG.connect(this.master);
      this.drones = this.base.map((fr, i) => {
        const o = c.createOscillator(); o.type = i === 1 ? "triangle" : "sawtooth"; o.frequency.value = fr;
        o.connect(f); o.start(); return o;
      });
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.13; lg.gain.value = 260; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      this.progO = c.createOscillator(); this.progO.type = "sine";
      this.progG = c.createGain(); this.progG.gain.value = 0;
      this.progO.connect(this.progG); this.progG.connect(this.master); this.progO.start();
      const len = Math.floor(c.sampleRate * 0.5), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = b;
    } catch (e) { this.ctx = null; }
  },
  setMuted(m) { if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.05); },
  tone(freq, dur = 0.1, type = "square", vol = 0.06, slide = null, delay = 0) {
    const c = this.ctx; if (!c || S.muted || S.test) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur = 0.12, freq = 1200, vol = 0.12) {
    const c = this.ctx; if (!c || S.muted || !this.noiseBuf || S.test) return;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
    s.buffer = this.noiseBuf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 2;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.03);
  },
  blip() { this.tone(rand(300, 1400), 0.05, "square", 0.03); },
  cycle() { this.tone(rand(480, 700), 0.05, "triangle", 0.08, rand(900, 1500)); },
  good() { this.tone(660, 0.08, "square", 0.05); this.tone(990, 0.14, "square", 0.05, null, 0.07); },
  bad() { this.tone(170, 0.22, "sawtooth", 0.06, 70); },
  thud() { this.tone(90, 0.28, "sine", 0.28, 38); },
  chord() { [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 1.5, "triangle", 0.05, null, i * 0.06)); this.noise(0.7, 3000, 0.05); },
  glitch() { this.noise(rand(0.05, 0.18), rand(300, 5000), 0.1); this.tone(rand(40, 90), 0.1, "square", 0.05); },
  kick() { this.tone(160, 0.2, "sine", 0.4, 42); },
  tick() { this.tone(2600, 0.03, "square", 0.025); },
  creak() { this.tone(110, 0.9, "sawtooth", 0.05, 280); },
  whoosh() { this.noise(0.5, 600, 0.08); this.tone(80, 0.5, "sine", 0.1, 400); },
  beep(long) { this.tone(740, long ? 0.42 : 0.12, "sine", 0.12); },
  note(i) { this.tone([262, 330, 392, 494, 587, 659][i % 6], 0.3, "triangle", 0.12); },
  update(prog) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime;
    const lvl = (S.running ? 0.055 : 0.02) * this.droneLevel * (1 - 0.95 * S.calmProx) * (S.calm ? 0.55 : 1) * (1 + S.boost * 0.6);
    this.droneG.gain.setTargetAtTime(S.test ? 0 : lvl, t, 0.3);
    this.drones.forEach((o, i) => o.frequency.setTargetAtTime(this.base[i] * this.dronePitch, t, 0.5));
    this.progG.gain.setTargetAtTime(prog > 0.01 && S.L && !S.test ? 0.018 + prog * 0.03 : 0, t, 0.1);
    this.progO.frequency.setTargetAtTime(200 + prog * 800, t, 0.1);
  },
};
function speak(text, force) {
  if (S.muted || S.test || !window.speechSynthesis || (!force && S.calm)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.75; u.pitch = 0.35; u.volume = 0.6;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { /* no voice */ }
}

// ---------- world objects (drawn on the canvas) ----------
function mk(shape, color, o = {}) {
  const r = o.r != null ? o.r : rand(14, 26);
  const a = rand(0, Math.PI * 2), base = o.base != null ? o.base : rand(40, 120);
  return Object.assign({
    shape, color, r, x: rand(r, W - r), y: rand(r, H - r), vx: Math.cos(a) * base, vy: Math.sin(a) * base, base,
    rot: rand(0, 6.28), vr: rand(-1.5, 1.5), spin: 0, blink: 0, blinkT: rand(1, 5), alpha: 1, tw: rand(1, 4), scale: 1,
  }, o, { r });
}
function scatter(n, o = {}) {
  const shapes = Object.values(SHAPE_OF);
  const made = [];
  for (let i = 0; i < n; i++) { const q = mk(pick(shapes), pick(COLOR_KEYS), Object.assign({}, o)); objs.push(q); made.push(q); }
  return made;
}
function toWorld(x, y) {
  const c = Math.cos(-S.worldRot), s = Math.sin(-S.worldRot), dx = (x - W / 2) * S.worldFlipX, dy = y - H / 2;
  return { x: (dx * c - dy * s) / S.worldScale + W / 2, y: (dx * s + dy * c) / S.worldScale + H / 2 };
}
function toScreen(x, y) {
  const c = Math.cos(S.worldRot), s = Math.sin(S.worldRot), dx = (x - W / 2) * S.worldScale, dy = (y - H / 2) * S.worldScale;
  return { x: (dx * c - dy * s) * S.worldFlipX + W / 2, y: dx * s + dy * c + H / 2 };
}
function moveObj(o, dt) {
  if (o.fixed) { if (o.update) o.update(o, dt); return; }
  const sp = S.speed * S.worldSpeed * (o.slow ? 0.08 : 1) * (o.speedMul != null ? o.speedMul : 1);
  if (o.flee) {
    const p = toWorld(S.px, S.py), dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (d < o.flee) { const f = (1 - d / o.flee) * (o.fleeForce || 2400) * dt; o.vx += (dx / d) * f; o.vy += (dy / d) * f; }
  }
  if (o.chase) {
    const p = toWorld(S.px, S.py), dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy) || 1;
    o.vx += (dx / d) * o.chase * dt; o.vy += (dy / d) * o.chase * dt;
  }
  if (o.avoid) {
    const dx = o.x - o.avoid.x, dy = o.y - o.avoid.y, d = Math.hypot(dx, dy) || 1, R = o.avoid.r;
    if (d < R) { const f = (1 - d / R) * 1100 * dt; o.vx += (dx / d) * f; o.vy += (dy / d) * f; }
  }
  if (o.gx || o.gy) { o.vx += o.gx * dt; o.vy += o.gy * dt; }
  const v = Math.hypot(o.vx, o.vy) || 1;
  if (v > o.base && !o.noDamp) { const k = Math.max(o.base / v, 1 - dt * 1.3); o.vx *= k; o.vy *= k; }
  o.x += o.vx * dt * sp; o.y += o.vy * dt * sp;
  o.rot += (o.vr + o.spin) * dt * sp; o.spin *= Math.pow(0.05, dt);
  if (o.alpha < 1 && !o.keepAlpha) o.alpha = Math.min(1, o.alpha + dt * 2);
  const bounce = o.bounce != null ? o.bounce : 1;
  if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx) * bounce; }
  if (o.x > W - o.r) { o.x = W - o.r; o.vx = -Math.abs(o.vx) * bounce; }
  if (o.y < o.r) { o.y = o.r; o.vy = Math.abs(o.vy) * bounce; }
  if (o.y > H - o.r) { o.y = H - o.r; o.vy = -Math.abs(o.vy) * bounce; }
  if (o.shape === "eye") {
    o.blinkT -= dt;
    if (o.blinkT <= 0 && !o.asleep) { o.blink = 1; o.blinkT = rand(1.2, 5.5); }
    o.blink = o.asleep ? 1 : Math.max(0, o.blink - dt * 4.5);
  }
  if (o.update) o.update(o, dt);
}
function hitObj(x, y, filter) {
  const pad = S.pointerType === "touch" ? 14 : 6;
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i];
    if (o.hidden || o.noHit || (filter && !filter(o))) continue;
    if (o.hw) {
      if (Math.abs(x - o.x) < o.hw * o.scale + pad && Math.abs(y - o.y) < o.hh * o.scale + pad) return o;
    } else if (Math.hypot(x - o.x, y - o.y) < o.r * 1.2 * (o.scale || 1) + pad) return o;
  }
  return null;
}
function popObj(o, n = 18) {
  const col = COLORS[o.color] || "#fff";
  for (let i = 0; i < n; i++) {
    const a = rand(0, 6.28), v = rand(80, 420);
    parts.push({ x: o.x, y: o.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.4, 0.9), max: 0.9, col, s: rand(2, 6) });
  }
  const i = objs.indexOf(o);
  if (i >= 0) objs.splice(i, 1);
}

function drawObj(o) {
  if (o.hidden) return;
  ctx.save();
  ctx.translate(o.x, o.y);
  let alpha = o.alpha;
  if (o.twinkle) alpha *= 0.35 + 0.65 * Math.abs(Math.sin(S.clock * o.tw));
  ctx.globalAlpha = alpha;
  const col = COLORS[o.color] || o.color;
  ctx.fillStyle = col;
  if (o.draw) { o.draw(o); ctx.restore(); return; }
  if (o.scale && o.scale !== 1) ctx.scale(o.scale, o.scale);
  switch (o.shape) {
    case "square":
      ctx.rotate(o.rot); ctx.fillRect(-o.r, -o.r, o.r * 2, o.r * 2);
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 2; ctx.strokeRect(-o.r, -o.r, o.r * 2, o.r * 2);
      break;
    case "circle":
      ctx.beginPath(); ctx.arc(0, 0, o.r, 0, 7); ctx.fill();
      break;
    case "tri":
      ctx.rotate(o.rot); ctx.beginPath();
      for (let i = 0; i < 3; i++) { const a = i * 2.0944 - 1.5708; ctx.lineTo(Math.cos(a) * o.r * 1.25, Math.sin(a) * o.r * 1.25); }
      ctx.closePath(); ctx.fill();
      break;
    case "star":
      ctx.rotate(o.rot); ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? o.r * 0.45 : o.r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      ctx.closePath(); ctx.fill();
      break;
    case "eye": drawEye(o, col); break;
  }
  if (o.label) {
    ctx.rotate(0);
    ctx.fillStyle = o.labelColor || "#000";
    ctx.font = `${Math.round(o.labelSize || o.r * 0.9)}px Bungee, Impact, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(o.label, 0, 1);
  }
  ctx.restore();
}
function drawEye(o, col) {
  const r = o.r, open = 1 - o.blink, h = r * 1.25 * Math.max(0.05, open);
  ctx.beginPath(); ctx.moveTo(-r * 1.45, 0);
  ctx.quadraticCurveTo(0, -h, r * 1.45, 0); ctx.quadraticCurveTo(0, h, -r * 1.45, 0); ctx.closePath();
  ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = col; ctx.stroke();
  if (open > 0.35) {
    const p = toWorld(S.px, S.py), a = Math.atan2(p.y - o.y, p.x - o.x), dd = r * 0.42;
    ctx.save(); ctx.clip();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(Math.cos(a) * dd, Math.sin(a) * dd * 0.6, r * 0.56, 0, 7); ctx.fill();
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(Math.cos(a) * dd * 1.12, Math.sin(a) * dd * 0.68, r * 0.25, 0, 7); ctx.fill();
    ctx.restore();
  } else if (o.asleep) {
    ctx.fillStyle = "#c9b8ff"; ctx.font = `${Math.round(r * 0.8)}px VT323, monospace`; ctx.fillText("z", r * 1.2, -r * 0.8);
  }
}
// a few reusable drawings for layer objects
function drawText(text, size, color, x = 0, y = 0, font = "Bungee, Impact, sans-serif") {
  ctx.fillStyle = color; ctx.font = `${Math.round(size)}px ${font}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, x, y);
}
function drawButton(o) {
  const r = o.r * (o.pressT > 0 ? 0.9 : 1);
  ctx.fillStyle = "#4a0010"; ctx.beginPath(); ctx.arc(0, r * 0.18, r * 1.08, 0, 7); ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
  g.addColorStop(0, "#ff8a9a"); g.addColorStop(0.5, o.color && COLORS[o.color] ? COLORS[o.color] : "#ff1f3d"); g.addColorStop(1, "#8a0016");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  if (o.label) drawText(o.label, r * 0.26, "#fff");
}
function drawKey(o) {
  const w = o.hw, h = o.hh;
  ctx.fillStyle = "#222"; ctx.fillRect(-w, -h + 6, w * 2, h * 2);
  ctx.fillStyle = "#e9e4f2"; ctx.fillRect(-w, -h, w * 2, h * 2 - 6);
  ctx.strokeStyle = "#999"; ctx.lineWidth = 2; ctx.strokeRect(-w + 6, -h + 5, w * 2 - 12, h * 2 - 18);
  drawText(o.label, h * 0.62, "#222", 0, -3);
}
function drawDoorShape(o, open, red) {
  const w = o.r * o.scale, h = o.r * 1.7 * o.scale;
  if (open) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, h * 2.6);
    g.addColorStop(0, "rgba(255,250,210,.75)"); g.addColorStop(1, "rgba(255,250,210,0)");
    ctx.fillStyle = g; ctx.fillRect(-h * 2.6, -h * 2.6, h * 5.2, h * 5.2);
  }
  ctx.fillStyle = "#2b1406"; ctx.fillRect(-w - 5, -h - 5, w * 2 + 10, h * 2 + 5);
  if (open) {
    ctx.fillStyle = "#fffbe0"; ctx.fillRect(-w, -h, w * 2, h * 2);
    ctx.fillStyle = red ? "#b0101c" : "#8a4b22";
    ctx.beginPath(); ctx.moveTo(-w, -h); ctx.lineTo(-w * 0.45, -h * 1.1); ctx.lineTo(-w * 0.45, h * 1.05); ctx.lineTo(-w, h); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = red ? "#d0182a" : "#8a4b22"; ctx.fillRect(-w, -h, w * 2, h * 2);
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2;
    ctx.strokeRect(-w * 0.7, -h * 0.85, w * 1.4, h * 0.7); ctx.strokeRect(-w * 0.7, h * 0.1, w * 1.4, h * 0.7);
    ctx.fillStyle = "#ffcf4a"; ctx.beginPath(); ctx.arc(w * 0.62, h * 0.05, Math.max(2.5, w * 0.12), 0, 7); ctx.fill();
  }
}

// ---------- the sentence ----------
function W_(opts, flags = {}) {
  if (typeof opts === "string") opts = [opts];
  return Object.assign({ opts, i: 0, custom: null }, flags);
}
const wtext = (w) => (w.letters ? w.letters.join("") : w.custom != null ? w.custom : w.opts[w.i]);
function wordById(L, id) { return L.words.find((x) => x.id === id) || null; }
function get(L, id) { const w = wordById(L, id); return w ? wtext(w) : null; }
function sentence(L) { return L.words.map(wtext); }
function sentenceText(L) { return sentence(L).join(" "); }
function setWordTo(w, text) { const k = w.opts.indexOf(text); if (k >= 0) { w.i = k; w.custom = null; } else w.custom = text; }

function renderWords(enter) {
  bar.innerHTML = "";
  const L = S.L;
  if (!L) return;
  L.words.forEach((w, k) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "word" + (enter ? " word-in" : "") + (w.cls ? " " + w.cls : "");
    const inner = document.createElement("span");
    inner.className = "wt";
    el.appendChild(inner);
    el._w = w; w.el = el;
    paintWord(w);
    el.style.setProperty("--d", (-Math.random() * 2.6).toFixed(2) + "s");
    el.style.setProperty("--r", rand(-2.5, 2.5).toFixed(1) + "deg");
    el.style.setProperty("--ad", (k * 0.13).toFixed(2) + "s");
    el.addEventListener("animationend", (e) => { if (e.animationName !== "jiggle") el.classList.remove("cycled", "wob", "word-in"); });
    bindWord(el, w);
    bar.appendChild(el);
  });
}
// update one word's look without rebuilding the sentence
function paintWord(w) {
  const el = w.el;
  if (!el || w.editing) return;
  const inner = el.querySelector(".wt");
  if (!inner) return;
  if (w.letters) {
    inner.innerHTML = "";
    w.letters.forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "lt" + (w.sel === i ? " sel" : "");
      s.dataset.i = i; s.textContent = ch;
      inner.appendChild(s);
    });
  } else {
    const t = wtext(w);
    inner.textContent = w.hidden ? "▒".repeat(Math.max(3, t.length)) : w.display ? w.display(w) : t;
  }
  el.style.color = w.ink || "";
  inner.style.setProperty("--wr", (w.rot || 0) + "deg");
  inner.style.setProperty("--wm", w.mirror ? -1 : 1);
  el.style.filter = w.blur ? `blur(${w.blur.toFixed(1)}px)` : "";
  el.style.opacity = w.fade != null ? w.fade : "";
  el.style.fontSize = w.size || "";
}
function bindWord(el, w) {
  el.addEventListener("pointerdown", (e) => {
    if (w.editing || !S.L) return;
    e.preventDefault();
    S.pointerType = e.pointerType;
    const letter = e.target && e.target.dataset && e.target.dataset.i != null ? Number(e.target.dataset.i) : null;
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
    const st = { x: e.clientX, y: e.clientY, drag: false };
    const move = (ev) => {
      const dx = ev.clientX - st.x, dy = ev.clientY - st.y;
      if (!st.drag && Math.hypot(dx, dy) > 12 && !w.noDrag) { st.drag = true; S.dragging = true; el.classList.add("dragging"); if (S.L && S.L.def.onWordDrag) S.L.def.onWordDrag(S.L, w, true); }
      if (st.drag) el.style.transform = `translate(${dx}px,${dy}px) rotate(${dx * 0.05}deg)`;
    };
    const up = (ev) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      S.dragging = false;
      if (S.L && st.drag && S.L.def.onWordDrag) S.L.def.onWordDrag(S.L, w, false);
      if (!st.drag) { if (ev.type === "pointerup") wordTap(w, letter); return; }
      dropWord(w, el, ev.clientX, ev.clientY);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); wordTap(w, w.letters ? 0 : null); }
  });
}
function wordTap(w, letter) {
  const L = S.L;
  if (!L) return;
  if (L.def.onWordTap && L.def.onWordTap(L, w, letter) === true) return;
  if (w.letters) { letterTap(L, w, letter == null ? 0 : letter); return; }
  if (w.onTap) { w.onTap(L, w); S.changes++; Snd.cycle(); if (L.def.onWord) L.def.onWord(L, w, "tap"); paintWord(w); return; }
  if (w.editable) { startEdit(w); return; }
  if (w.heavy || w.opts.length < 2) {
    if (w.el) { w.el.classList.remove("wob"); void w.el.offsetWidth; w.el.classList.add("wob"); }
    Snd.thud();
    if (L.def.onHeavy) L.def.onHeavy(L, w);
    return;
  }
  w.i = (w.i + 1) % w.opts.length;
  w.custom = null;
  S.changes++;
  Snd.cycle();
  if (L.def.onWord) L.def.onWord(L, w, "cycle");
  if (S.L !== L) return;
  renderWords();
  if (w.el) w.el.classList.add("cycled");
}
function letterTap(L, w, i) {
  if (w.mode === "wheel") {
    const opts = w.wheel[i];
    const k = (opts.indexOf(w.letters[i]) + 1) % opts.length;
    w.letters[i] = opts[k];
  } else if (w.sel == null) { w.sel = i; Snd.tick(); paintWord(w); return; }
  else if (w.sel === i) { w.sel = null; paintWord(w); return; }
  else { const a = w.sel; [w.letters[a], w.letters[i]] = [w.letters[i], w.letters[a]]; w.sel = null; }
  S.changes++; Snd.cycle();
  paintWord(w);
  if (L.def.onWord) L.def.onWord(L, w, "letter");
}
function removeWord(L, w, el) {
  if (el) {
    const rect = el.getBoundingClientRect(), c = document.createElement("div");
    c.className = "falling"; c.textContent = wtext(w);
    c.style.left = rect.left + "px"; c.style.top = rect.top + "px";
    c.style.fontSize = getComputedStyle(bar).fontSize;
    c.style.setProperty("--fx", rand(-120, 120) + "px"); c.style.setProperty("--fr", rand(-540, 540) + "deg");
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1700);
  }
  L.words.splice(L.words.indexOf(w), 1);
  S.changes++; Snd.whoosh();
  if (L.def.onWord) L.def.onWord(L, w, "remove");
  if (S.L === L) renderWords();
}
function swapWords(L, a, b) {
  const i = L.words.indexOf(a), j = L.words.indexOf(b);
  L.words[i] = b; L.words[j] = a;
  S.changes++; Snd.cycle();
  if (L.def.onWord) L.def.onWord(L, a, "move");
  if (S.L === L) renderWords();
}
function dropWord(w, el, x, y) {
  const L = S.L;
  if (!L) return;
  el.style.visibility = "hidden";
  const target = document.elementsFromPoint(x, y).map((n) => (n.closest ? n.closest(".word") : null)).find((n) => n && n !== el && n._w);
  el.style.visibility = "";
  const r = bar.getBoundingClientRect();
  const outside = y < r.top - 70 || y > r.bottom + 70 || x < r.left - 40 || x > r.right + 40;
  if (target) swapWords(L, w, target._w);
  else if (outside && w.removable) removeWord(L, w, el);
  else {
    if (outside) { popText(x, y, pick(["IT CLINGS.", "IT WON'T GO.", "STAYS."]), "#ffb3c4"); Snd.thud(); }
    if (L.def.onWordDrop) L.def.onWordDrop(L, w, x, y);
    renderWords();
  }
}
function startEdit(w) {
  if (w.editing) return;
  w.editing = true;
  const inp = document.createElement("input");
  inp.className = "word-input";
  inp.value = wtext(w);
  inp.maxLength = 24;
  inp.size = Math.max(3, inp.value.length + 1);
  inp.setAttribute("autocapitalize", "characters");
  inp.setAttribute("autocomplete", "off");
  inp.setAttribute("spellcheck", "false");
  inp.setAttribute("aria-label", "edit this word");
  w.el.replaceWith(inp);
  w.el = inp;
  inp.focus(); inp.select();
  const L0 = S.L;
  const commit = () => {
    if (!w.editing) return;
    w.editing = false;
    const v = cleanText(inp.value);
    if (v && v !== wtext(w)) { w.custom = v; S.changes++; Snd.cycle(); }
    const L = S.L;
    if (L === L0) {
      if (L.def.onWord) L.def.onWord(L, w, "type");
      checkAnswer(L, wtext(w));
      if (S.L === L) renderWords();
    }
  };
  inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") inp.blur(); });
  inp.addEventListener("input", () => {
    inp.size = Math.max(3, inp.value.length + 1);
    Snd.tick();
    const L = S.L;
    if (L && L === L0) { const v = cleanText(inp.value); if (L.def.onType) L.def.onType(L, v); checkAnswer(L, v); }
  });
  inp.addEventListener("blur", commit);
  inp.addEventListener("pointerdown", (e) => e.stopPropagation());
}
const cleanText = (v) => v.toUpperCase().replace(/[^A-Z0-9 '?!.-]/g, "").replace(/\s+/g, " ").trim();
// layers with def.answers(L) accept a typed word: via the keyboard or by editing a word
function checkAnswer(L, v) {
  if (!L || !L.def.answers || !v) return false;
  const ans = L.def.answers(L);
  if (ans.some((a) => v === a || v.replace(/[^A-Z0-9]/g, "") === a.replace(/[^A-Z0-9]/g, ""))) { L.p = 1; return true; }
  return false;
}
// The game lies about the sentence, for a moment
function wordLie(whole) {
  const L = S.L;
  if (!L || S.dragging || L.words.some((w) => w.editing || w.letters || w.spin)) return;
  const els = [...bar.querySelectorAll(".word")].filter((e) => e._w);
  if (!els.length) return;
  if (L.def.lie) {
    const lie = L.def.lie(L);
    if (lie && lie.w && lie.w.el) {
      const inner = lie.w.el.querySelector(".wt");
      if (inner) { inner.textContent = lie.text; lie.w.el.classList.add("lie"); }
      Snd.glitch();
      setTimeout(() => { paintWord(lie.w); if (lie.w.el) lie.w.el.classList.remove("lie"); }, 520);
      return;
    }
  }
  if (whole) {
    const fake = pick(LIES).split(" ");
    els.forEach((el, i) => { el.querySelector(".wt").textContent = fake[i] || "…"; el.classList.add("lie"); });
  } else {
    const el = pick(els);
    el.querySelector(".wt").textContent = pick(LIE_WORDS); el.classList.add("lie");
  }
  Snd.glitch();
  setTimeout(() => els.forEach((el) => { if (el._w) paintWord(el._w); el.classList.remove("lie"); }), whole ? 420 : 380);
}

// ---------- little texts ----------
function popText(x, y, text, color = "#fff", big = false) {
  if (S.test) return;
  const el = document.createElement("div");
  el.className = "pop" + (big ? " big" : "");
  el.textContent = text; el.style.left = x + "px"; el.style.top = y + "px"; el.style.color = color;
  popsEl.appendChild(el);
  setTimeout(() => el.remove(), big ? 2300 : 1100);
}
let whisperTimer = 0, whisperTyping = 0;
function whisper(text, hold = 7) {
  if (S.test) return;
  clearInterval(whisperTyping); clearTimeout(whisperTimer);
  whisperEl.textContent = "";
  whisperEl.classList.add("on");
  let i = 0;
  whisperTyping = setInterval(() => {
    i++;
    whisperEl.textContent = text.slice(0, i);
    if (i % 2) Snd.tone(rand(1800, 2400), 0.015, "square", 0.012);
    if (i >= text.length) clearInterval(whisperTyping);
  }, 34);
  whisperTimer = setTimeout(() => whisperEl.classList.remove("on"), hold * 1000 + text.length * 34);
}
function setSmall(text) { smallEl.textContent = text || ""; smallEl.classList.toggle("on", !!text); }
function flash() { if (S.test) return; flashEl.classList.remove("on"); void flashEl.offsetWidth; flashEl.classList.add("on"); }
function shake() {
  if (S.calm || S.test) return;
  document.body.classList.remove("shake"); void document.body.offsetWidth; document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 460);
}
const barBottom = () => bar.getBoundingClientRect().bottom;
function meterCenter() { const r = meterEl.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; }
function fillIf(L, cond, dt, secs = 2, drain = 0.8) { L.p = cond ? L.p + dt / secs : Math.max(0, L.p - dt * drain); }
function deviceKind() {
  const touch = window.matchMedia && matchMedia("(hover: none)").matches;
  if (!touch) return "A COMPUTER";
  return Math.min(screen.width, screen.height) < 700 ? "A PHONE" : "A TABLET";
}

// ---------- layer registry ----------
const LAYER_DEFS = [];
const BY_ID = {};
function def(d) {
  d.n = LAYER_DEFS.length + 1;
  LAYER_DEFS.push(d);
  BY_ID[d.id] = d;
  return d;
}

// ---------- world states (used by a few layers, always reset between layers) ----------
function resetWorld() {
  S.skyMode = "NORMAL"; S.skyColor = null; S.worldRotT = 0; S.worldScaleT = 1; S.worldSpeed = 1; S.worldHidden = false;
  S.worldFlipX = 1; S.dark = 0; S.calmProx = 0; S.boost = 0;
  floatLayer.classList.remove("flip", "gone", "huge");
  veilEl.className = "veil";
  document.body.className = document.body.className.replace(/\bcur-\S+/g, "").trim();
  bar.classList.remove("mirror-bar", "blur-bar");
  S.cursorMode = null; Snd.droneLevel = 1; Snd.dronePitch = 1;
}

// ---------- the daily run & the abyss ----------
const RUN_KEY = "mysterle-run", CODEX_KEY = "mysterle-codex", ABYSS_KEY = "mysterle-abyss";
let DAILY = [], ABYSS_ORDER = [];
function buildSequences() {
  const r = mulberry32(hashStr("mysterle-pick-" + NUM));
  const used = new Set(), fams = new Set();
  DAILY = DAILY_TIERS.map((tier) => {
    let pool = LAYER_DEFS.filter((d) => d.tier === tier && !used.has(d.id) && !fams.has(d.fam || d.id));
    if (!pool.length) pool = LAYER_DEFS.filter((d) => d.tier === tier && !used.has(d.id));
    if (!pool.length) pool = LAYER_DEFS.filter((d) => !used.has(d.id));
    const d = pool[Math.floor(r() * pool.length)];
    used.add(d.id); fams.add(d.fam || d.id);
    return d.id;
  });
  const ar = mulberry32(hashStr("mysterle-abyss-order"));
  ABYSS_ORDER = [];
  for (let t = 1; t <= 5; t++) ABYSS_ORDER.push(...shuffleWith(LAYER_DEFS.filter((d) => d.tier === t).map((d) => d.id), ar));
}
function loadRun() {
  const run = store.get(RUN_KEY, null);
  if (run && run.num === NUM) return run;
  return { num: NUM, idx: 0, elapsed: 0, clicks: 0, changes: 0, hints: 0, perHints: [], done: false };
}
function saveRun() {
  if (S.test || !S.started) return; // only a run the player started is ever saved
  if (S.mode === "daily") {
    store.set(RUN_KEY, { num: NUM, idx: S.idx, elapsed: S.runClock, clicks: S.clicks, changes: S.changes, hints: S.hints,
      perHints: S.perHints, done: S.ended });
  } else {
    store.set(ABYSS_KEY, { idx: S.idx, cycle: S.cycle });
  }
}
function codex() { return store.get(CODEX_KEY, {}); }
function codexAdd(id) {
  if (S.test) return;
  const c = codex();
  if (!c[id]) { c[id] = NUM; store.set(CODEX_KEY, c); return true; }
  return false;
}

function startRun(mode) {
  S.mode = mode;
  S.started = true; S.running = true; S.ended = false;
  if (mode === "daily") {
    const run = loadRun();
    S.seq = DAILY; S.idx = run.idx; S.runClock = run.elapsed; S.clicks = run.clicks; S.changes = run.changes;
    S.hints = run.hints; S.perHints = run.perHints || [];
  } else {
    const a = store.get(ABYSS_KEY, { idx: 0, cycle: 0 });
    S.seq = ABYSS_ORDER; S.idx = a.idx; S.cycle = a.cycle; S.runClock = 0; S.clicks = 0; S.changes = 0; S.hints = 0; S.perHints = [];
  }
  document.body.classList.toggle("abyss", mode === "abyss");
  startLayer();
}
function makeLayer(d, salt) {
  const L = { def: d, p: 0, t: 0, lastWhisper: 0, hintsUsed: 0 };
  L.rng = mulberry32(hashStr(NUM + ":" + d.id + ":" + salt));
  L.pick = (arr) => arr[Math.floor(L.rng() * arr.length)];
  L.int = (a, b) => a + Math.floor(L.rng() * (b - a + 1));
  L.chance = (p) => L.rng() < p;
  L.shuffle = (arr) => shuffleWith(arr, L.rng);
  return L;
}
function startLayer() {
  const d = BY_ID[S.seq[S.idx]];
  const L = makeLayer(d, S.mode === "abyss" ? "a" + S.cycle : "d");
  beginLayer(L);
  renderPips();
  Snd.whoosh();
  saveRun();
}
function beginLayer(L) {
  resetWorld();
  S.L = L; S.hintLevel = 0;
  objs.length = 0; setSmall(""); typedEl.textContent = "";
  L.buf = "";
  const d = L.def;
  if (d.prep) d.prep(L);
  L.words = d.words(L);
  if (d.setup) d.setup(L);
  renderWords(true);
}
function layerLabel() {
  return S.mode === "abyss" ? `ABYSS ${S.idx + 1} / ${S.seq.length}` : `LAYER ${S.idx + 1} / ${S.seq.length}`;
}
function solveLayer() {
  const L = S.L;
  if (!L) return;
  L.solved = true;
  if (L.def.teardown) L.def.teardown(L);
  resetWorld();
  S.L = null;
  if (S.test) return;
  const fresh = codexAdd(L.def.id);
  Snd.chord(); flash();
  bar.querySelectorAll(".word, .word-input").forEach((el) => {
    el.style.setProperty("--ex", rand(-60, 60) + "vw"); el.style.setProperty("--ey", rand(-40, 60) + "vh");
    el.style.setProperty("--er", rand(-720, 720) + "deg"); el.classList.add("boom");
  });
  for (const o of objs.slice()) popObj(o);
  objs.length = 0;
  setSmall("");
  setTimeout(() => { if (!S.L) bar.innerHTML = ""; }, 900);
  revealEl.innerHTML = `<small></small><span></span><em></em>`;
  revealEl.querySelector("small").textContent = layerLabel();
  revealEl.querySelector("span").textContent = L.def.reveal;
  revealEl.querySelector("em").textContent = fresh ? `new rule understood · ${Object.keys(codex()).length} / ${LAYER_DEFS.length}` : "";
  revealEl.classList.add("on");
  whisperEl.classList.remove("on");
  S.perHints[S.idx] = L.hintsUsed;
  S.idx++;
  const last = S.mode === "daily" && S.idx >= S.seq.length;
  if (S.mode === "abyss" && S.idx >= S.seq.length) { S.idx = 0; S.cycle++; }
  if (last) S.ended = true;
  saveRun();
  renderPips();
  setTimeout(() => {
    revealEl.classList.remove("on");
    if (last) endGame(); else if (S.running) startLayer();
  }, last ? 3200 : 2700);
}
function renderPips() {
  if (S.mode === "abyss") { pipsEl.innerHTML = `<span class="abyss-count">⬇ ${S.idx + 1}</span>`; return; }
  pipsEl.innerHTML = DAILY.map((_, i) => `<i class="${i < S.idx ? "done" : i === S.idx && S.running ? "cur" : ""}"></i>`).join("");
}

function rankFor(sec, hints) {
  const t = sec + hints * 60;
  if (t < 480) return ["CLAIRVOYANT", "you saw through it before it began."];
  if (t < 900) return ["SEER", "the chaos never really fooled you."];
  if (t < 1500) return ["DETECTIVE", "confused, then not."];
  if (t < 2700) return ["WANDERER", "you got lost and found the way out."];
  return ["SLEEPWALKER", "you understood. eventually."];
}
function shareText() {
  const run = loadRun();
  const [rank] = rankFor(run.elapsed, run.hints);
  return [
    `MYSTERLE #${NUM} · ${DAY_NAME}`,
    `${rank} ⏱ ${fmt(run.elapsed)}`,
    DAILY.map((_, i) => ((run.perHints || [])[i] ? "◇" : "◆")).join(""),
    `🔀 ${run.changes} · 👆 ${run.clicks}${run.hints ? " · 💡" + run.hints : ""}`,
    location.origin + location.pathname,
  ].join("\n");
}
function untilNext() {
  const t = new Date(); t.setHours(24, 0, 0, 0);
  const mins = Math.max(1, Math.round((t - new Date()) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function endGame() {
  S.running = false; S.ended = true;
  S.calmProx = 0.85;
  saveRun();
  renderPips();
  showEnd();
}
function showEnd() {
  const run = loadRun();
  const [rank, verdict] = rankFor(run.elapsed, run.hints);
  $("end-num").textContent = `#${NUM} · ${DAY_NAME}`;
  $("end-rank").textContent = rank;
  $("end-verdict").textContent = verdict;
  $("end-time").textContent = fmt(run.elapsed);
  $("end-clicks").textContent = run.clicks;
  $("end-changes").textContent = run.changes;
  $("end-hints").textContent = run.hints;
  $("end-grid").textContent = DAILY.map((_, i) => ((run.perHints || [])[i] ? "◇" : "◆")).join(" ");
  $("end-codex").textContent = `rules understood: ${Object.keys(codex()).length} / ${LAYER_DEFS.length}`;
  $("end-next").textContent = `the next mystery appears in ${untilNext()}`;
  $("end").hidden = false;
}
function copyText(text, btn) {
  const label = btn.textContent;
  const done = () => { btn.textContent = "COPIED"; setTimeout(() => (btn.textContent = label), 1600); };
  if (navigator.share && matchMedia("(hover: none)").matches) { navigator.share({ text }).catch(() => {}); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  else fallbackCopy(text, done);
}
function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); done(); } catch (e) { /* nothing */ }
  ta.remove();
}

// ---------- hints ----------
function updateHints() {
  const L = S.L;
  if (!L || S.test) return;
  const th = [35, 80, 140];
  if (S.hintLevel < 3 && L.t > th[S.hintLevel]) {
    S.hintLevel++;
    whisper("✶ " + L.def.hints[S.hintLevel - 1]); L.lastWhisper = L.t;
  } else if (S.hintLevel > 0 && L.t - L.lastWhisper > 40) {
    whisper("✶ " + L.def.hints[S.hintLevel - 1]); L.lastWhisper = L.t;
  }
}
function useHint() {
  const L = S.L;
  if (!L) { whisper(S.ended ? "there is nothing left to hint at." : "not now."); return; }
  if (L.def.onTool && L.def.onTool(L, "hint") === true) return;
  if (S.hintLevel < 3) { S.hintLevel++; S.hints++; L.hintsUsed++; }
  whisper("✶ " + L.def.hints[S.hintLevel - 1]);
  L.lastWhisper = L.t;
  saveRun();
}

// ---------- the chaos ----------
let floatT = 0, evT = 4, titleT = 3, titleGlitched = false, cdBusy = false, lastInvert = 0, titleFrame = 0;
function div(cls) { const d = document.createElement("div"); d.className = cls; return d; }
function spawnFloater(kind, x, y, text) {
  if (S.test) return null;
  const L = S.L, fw = L && L.def.floatWords;
  if (!kind) {
    const r = Math.random();
    kind = r < 0.16 ? "btn" : r < 0.46 ? "glyph" : r < 0.53 ? "bar" : r < 0.57 ? "win" : "text";
    if (L && L.def.fakeRate && Math.random() < L.def.fakeRate) kind = "btn";
  }
  let el;
  const fwText = () => (typeof fw === "function" ? fw(L) : fw);
  if (kind === "btn") {
    el = document.createElement("button"); el.type = "button"; el.className = "fl fake";
    el.textContent = text || (fw && Math.random() < 0.5 ? pick(fwText()) : pick(FAKE_BTNS));
  } else if (kind === "glyph") {
    el = div("fl glyph");
    el.textContent = Array.from({ length: randInt(1, 4) }, () => pick(GLYPHS)).join("");
    el.style.fontSize = rand(20, 100) + "px";
  } else if (kind === "bar") {
    el = div("fl fbar"); el.innerHTML = "<i></i><span></span>"; el.querySelector("span").textContent = pick(BAR_LABELS);
  } else if (kind === "win") {
    el = div("fl fwin");
    el.innerHTML = "<b></b><p></p><button class='fake' type='button'>OK</button>";
    el.querySelector("b").textContent = pick(WIN_TITLES); el.querySelector("p").textContent = text || pick(WIN_TEXT);
  } else {
    el = div("fl ftext" + (Math.random() < 0.4 ? " mono" : ""));
    el.textContent = text || (fw && Math.random() < 0.4 ? pick(fwText()) : pick(PHRASES));
    el.style.fontSize = rand(14, 52) + "px";
  }
  const still = kind === "btn" || kind === "win";
  let anim = pick(still ? ["fl-drift", "fl-wobble"] : ["fl-drift", "fl-zoom", "fl-spin", "fl-blink", "fl-wobble"]);
  if (S.calm && anim === "fl-blink") anim = "fl-drift";
  const dur = (still ? rand(4, 8) : rand(1.6, 5)) * (S.calm ? 1.8 : 1);
  el.style.left = (x != null ? x : rand(-5, 92)) + "%";
  el.style.top = (y != null ? y : rand(6, 90)) + "%";
  const spread = still ? 14 : 45;
  el.style.setProperty("--dx", rand(-spread, spread) + "vw");
  el.style.setProperty("--dy", (ANOMS.has("fall") ? rand(25, 80) : rand(-spread, spread)) + "vh");
  el.style.setProperty("--rot", (still ? rand(-20, 20) : rand(-360, 360)) + "deg");
  el.style.setProperty("--s1", rand(0.5, still ? 1.2 : 3).toFixed(2));
  if (!still) el.style.color = `hsl(${randInt(0, 360)},100%,${randInt(60, 82)}%)`;
  if (kind === "btn") el.style.color = "#fff";
  el.style.animation = `${anim} ${dur.toFixed(2)}s ${pick(["linear", "ease-in", "ease-out", "cubic-bezier(.7,-0.5,.3,1.5)"])} forwards`;
  floatLayer.appendChild(el);
  setTimeout(() => el.remove(), dur * 1000 + 120);
  return el;
}
function spawnDialog(text = "ARE YOU STILL THERE?", btns = ["YES", "YES"]) {
  if (S.test) return;
  const d = div("fwin dialog");
  d.innerHTML = "<b>Mysterle.exe</b><p></p>";
  d.querySelector("p").textContent = text;
  btns.forEach((b) => { const e = document.createElement("button"); e.className = "fake"; e.type = "button"; e.textContent = b; d.appendChild(e); });
  popsEl.appendChild(d);
  Snd.tone(880, 0.12, "square", 0.05); Snd.tone(660, 0.18, "square", 0.05, null, 0.12);
  setTimeout(() => d.remove(), 4200);
}
function fakeReact(btn) {
  btn.textContent = pick(RETORTS);
  btn.classList.add("hit");
  Snd.glitch();
  const r = btn.getBoundingClientRect();
  for (let i = 0; i < 3; i++) spawnFloater("glyph", ((r.left + rand(-40, 40)) / W) * 100, ((r.top + rand(-40, 40)) / H) * 100);
  const win = btn.closest(".fwin, .fakeend");
  if (win) setTimeout(() => { if (win === fakeEndEl) win.classList.remove("on"); else win.remove(); }, 250);
}
function countdownEvent() {
  if (cdBusy) return;
  cdBusy = true;
  let n = 5;
  const lines = pick([["SELF-DESTRUCT IN", "...JUST KIDDING"], ["REALITY RESETS IN", "RESET COMPLETE. NOTHING CHANGED."],
    ["THE RULES CHANGE IN", "THE RULES HAVE CHANGED."], ["UNDERSTANDING IN", "NOT YET."], ["HINT IN", "THAT WAS THE HINT."],
    ["THE EYE OPENS IN", "IT WAS ALREADY OPEN."], ["TUESDAY IN", "IT IS NOW TUESDAY."]]);
  const tick = () => {
    if (n > 0) { countdownEl.textContent = lines[0] + " " + n; countdownEl.classList.add("on"); Snd.tick(); n--; setTimeout(tick, 700); }
    else { countdownEl.textContent = lines[1]; Snd.glitch(); setTimeout(() => { countdownEl.classList.remove("on"); cdBusy = false; }, 1500); }
  };
  tick();
}
function fakeEnding() {
  const [big, small, btn] = pick([["YOU WIN", "(you didn't)", "COLLECT PRIZE"], ["GAME OVER", "please insert understanding", "CONTINUE"],
    ["LAYER 99", "you skipped ahead", "GO BACK"], ["THE END", "thank you for playing mysterle", "PLAY AGAIN"],
    ["CONNECTION LOST", "the rules went offline", "RECONNECT"]]);
  fakeEndEl.querySelector("b").textContent = big;
  fakeEndEl.querySelector("p").textContent = small;
  fakeEndEl.querySelector("button").textContent = btn;
  fakeEndEl.classList.add("on");
  Snd.chord();
  setTimeout(() => fakeEndEl.classList.remove("on"), 1900);
}
const EVENTS = [
  { calm: false, run() { shake(); Snd.glitch(); } },
  { calm: false, run() {
    if (now() - lastInvert < 6) return;
    lastInvert = now();
    document.documentElement.classList.add("invert"); Snd.glitch();
    setTimeout(() => document.documentElement.classList.remove("invert"), 120);
  } },
  { calm: true, run() { bar.style.setProperty("--tilt", rand(-9, 9).toFixed(1) + "deg"); setTimeout(() => bar.style.setProperty("--tilt", ANOMS.has("slant") ? "-5deg" : "0deg"), 2600); } },
  { calm: true, run() { for (let i = 0; i < (S.calm ? 4 : 16); i++) spawnFloater(Math.random() < 0.7 ? "glyph" : "text"); } },
  { calm: true, run: countdownEvent },
  { calm: true, run() { bigEyeEl.classList.add("on"); setTimeout(() => bigEyeEl.classList.remove("on"), 3400); } },
  { calm: false, run() { S.hueJump = rand(90, 240); Snd.glitch(); } },
  { calm: true, run() { wordLie(false); } },
  { calm: false, run() { wordLie(true); } },
  { calm: false, run() { bar.classList.add("split"); Snd.glitch(); setTimeout(() => bar.classList.remove("split"), 650); } },
  { calm: true, run() { spawnFloater("win"); } },
  { calm: true, run() { document.querySelectorAll(".ticker").forEach((t) => t.classList.toggle("rev")); } },
  { calm: false, run() { S.tearT = 0.35; Snd.noise(0.3, 200, 0.08); } },
  { calm: false, run() { for (const o of objs) { o.vx *= -1; o.vy *= -1; } popText(W / 2, H * 0.7, "↺", "#2af0ff", true); } },
  { calm: false, run() { bar.classList.add("flee"); setTimeout(() => bar.classList.remove("flee"), 900); } },
  { calm: true, run() { for (let i = 0; i < 6; i++) spawnFloater("text", rand(5, 85), rand(10, 85), "𓂀"); } },
];
function updateChaos(dt) {
  if (S.test) return;
  floatT -= dt;
  if (floatT <= 0) {
    const base = S.ended && !S.running ? 2.5 : S.calm ? 1.4 : 0.22;
    floatT = (base * rand(0.6, 1.4)) / (1 + S.boost);
    if (floatLayer.childElementCount < (S.calm ? 10 : 46)) spawnFloater();
  }
  if (!S.running) return;
  evT -= dt;
  if (evT <= 0) {
    evT = S.calm ? rand(8, 15) : rand(2.2, 5.5) / (1 + S.boost);
    const pool = EVENTS.filter((e) => !S.calm || e.calm);
    pick(pool).run();
  }
  // daily anomalies
  if (ANOMS.has("stutter") && !S.calm && Math.random() < dt * 0.25) S.stutterT = rand(0.15, 0.35);
  if (ANOMS.has("tears") && !S.calm && Math.random() < dt * 0.2) S.tearT = 0.25;
  if (ANOMS.has("clock") && Math.random() < dt * 0.15) S.clockLieT = 0.9;
  if (ANOMS.has("mirror") && Math.random() < dt * 0.06) S.mirrorT = 3;
  if (ANOMS.has("endings") && !S.calm && Math.random() < dt * 0.012 && S.L) fakeEnding();
  if (ANOMS.has("voice")) { S.voiceT -= dt; if (S.voiceT <= 0) { S.voiceT = rand(45, 90); speak(pick(VOICE_LINES)); } }
  if (S.mirrorT > 0) { S.mirrorT -= dt; bar.classList.toggle("mirror-moment", S.mirrorT > 0); }
  if (ANOMS.has("wander")) bar.style.translate = `${(Math.sin(S.clock * 0.31) * 34).toFixed(1)}px ${(Math.cos(S.clock * 0.23) * 16).toFixed(1)}px`;
}
function updateTitle(dt) {
  titleT -= dt;
  if (titleT > 0 || S.test) return;
  const L = S.L;
  if (L && L.def.title) {
    titleFrame++;
    const t = L.def.title(L, titleFrame);
    document.title = t || TITLE_GLITCH[titleFrame % TITLE_GLITCH.length];
    titleT = 0.8;
  } else if (titleGlitched) {
    document.title = "MYSTERLE"; titleGlitched = false; titleT = rand(3, 8);
  } else {
    if (S.running && Math.random() < 0.4) { document.title = pick(TITLE_GLITCH.slice(1)); titleGlitched = true; titleT = 0.6; }
    else titleT = rand(3, 8);
  }
}

// ---------- drawing ----------
function drawBg(dt) {
  const sky = S.skyMode;
  const hueSpeed = sky === "SLOW" ? 0 : (S.calm ? 6 : 28) * S.speed;
  S.hue = (S.hue + dt * hueSpeed + S.hueJump) % 360; S.hueJump = 0;
  if (S.skyColor) { ctx.fillStyle = S.skyColor; ctx.fillRect(0, 0, W, H); }
  else {
    const h = sky === "RED" ? 352 : S.hue, light = sky === "OPEN" ? 2.6 : sky === "CLOSED" ? 0.35 : 1;
    const cy = sky === "UPSIDE DOWN" ? H * 0.9 : H * 0.45;
    if (sky === "GONE") { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); }
    else {
      const g = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, Math.max(W, H) * 0.85);
      g.addColorStop(0, `hsl(${h},${sky === "RED" ? 90 : 70}%,${Math.min(60, 14 * light)}%)`);
      g.addColorStop(0.6, `hsl(${(h + (sky === "RED" ? 8 : 70)) % 360},75%,${6 * light}%)`);
      g.addColorStop(1, `hsl(${(h + (sky === "RED" ? 16 : 140)) % 360},80%,${3 * light}%)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }
  if (S.worldHidden || sky === "GONE") return;
  const h = S.hue;
  const sp = S.speed * S.worldSpeed * (sky === "SLOW" ? 0.1 : 1) * (sky === "UPSIDE DOWN" ? -1 : 1);
  S.sigRot += dt * sp * 0.3;
  ctx.save();
  ctx.translate(W / 2, H * 0.52);
  ctx.globalAlpha = 0.16 * S.noise;
  ctx.strokeStyle = `hsl(${(h + 180) % 360},90%,65%)`;
  ctx.lineWidth = 1.5;
  const skyScale = sky === "HUGE" ? 1.8 : 1;
  [[3, 1], [5, 2], [7, 3]].forEach(([n, m], k) => {
    const R = Math.min(W, H) * (0.17 + 0.12 * k) * skyScale;
    ctx.save(); ctx.rotate(S.sigRot * (k % 2 ? -1 : 1) * (1 + k * 0.4));
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const a = (i * m * Math.PI * 2) / n; ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 1.04, 0, 7); ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const Rs = Math.max(W, H) * 0.62 * skyScale, eyes = ANOMS.has("eyerain");
  for (const p of swirl) {
    p.a += p.w * dt * sp;
    const x = W / 2 + Math.cos(p.a) * p.R * Rs, y = H / 2 + Math.sin(p.a) * p.R * Rs * 0.7;
    ctx.fillStyle = `hsla(${(h + p.h) % 360},100%,70%,${p.al * S.noise})`;
    const s = p.s * (sky === "HUGE" ? 2.5 : 1);
    if (eyes) {
      ctx.beginPath(); ctx.ellipse(x, y, s * 2.2, s * 1.1, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(x, y, s * 0.6, 0, 7); ctx.fill();
    } else ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}
function draw(dt) {
  if (S.stutterT > 0) { S.stutterT -= dt; return; }
  drawBg(dt);
  const L = S.L;
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(S.worldFlipX, 1); ctx.rotate(S.worldRot); ctx.scale(S.worldScale, S.worldScale); ctx.translate(-W / 2, -H / 2);
  if (!S.worldHidden) {
    if (ANOMS.has("double") && !S.calm) {
      ctx.save(); ctx.translate(Math.sin(S.clock * 1.7) * 12, 6); ctx.globalAlpha = 0.3;
      for (const o of objs) { const a = o.alpha; o.alpha = a * 0.35; drawObj(o); o.alpha = a; }
      ctx.restore();
    }
    for (const o of objs) drawObj(o);
    if (L && L.def.drawWorld) L.def.drawWorld(L);
  }
  ctx.globalCompositeOperation = "lighter";
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
    ctx.globalAlpha = p.life / p.max; ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.s, p.s);
  }
  ctx.restore();
  if (S.dark > 0) {
    // darkness with a flashlight around the pointer
    const g = ctx.createRadialGradient(S.px, S.py, 20, S.px, S.py, 150);
    g.addColorStop(0, `rgba(0,0,0,0)`); g.addColorStop(1, `rgba(0,0,0,${S.dark})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  ctx.save();
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    r.life -= dt;
    if (r.life <= 0) { rings.splice(i, 1); continue; }
    r.r += r.v * dt;
    ctx.strokeStyle = `rgba(${r.col},${(r.life / r.max).toFixed(3)})`; ctx.lineWidth = r.w;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7); ctx.stroke();
  }
  const t = performance.now() / 1000;
  for (let i = trail.length - 1; i >= 0; i--) {
    const p = trail[i], age = t - p.t;
    if (age > 0.45) { trail.splice(i, 1); continue; }
    if (S.cursorMode === "GONE") continue;
    ctx.globalAlpha = (1 - age / 0.45) * 0.7 * S.noise;
    ctx.fillStyle = `hsl(${(S.hue + i * 12) % 360},100%,70%)`;
    ctx.beginPath(); ctx.arc(p.x, p.y, 2 + (1 - age / 0.45) * 5, 0, 7); ctx.fill();
  }
  if (ANOMS.has("ghosts")) {
    ctx.globalAlpha = 0.45 * S.noise;
    for (const g of ghosts) {
      g.x = g.x == null ? S.px : g.x + (S.px + g.ox - g.x) * Math.min(1, dt / g.lag);
      g.y = g.y == null ? S.py : g.y + (S.py + g.oy - g.y) * Math.min(1, dt / g.lag);
      ctx.save(); ctx.translate(g.x, g.y); ctx.fillStyle = "#fff"; ctx.strokeStyle = "#000";
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 16); ctx.lineTo(10, 25); ctx.lineTo(13, 23); ctx.lineTo(9, 14); ctx.lineTo(17, 14); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.restore();
    }
  }
  ctx.restore();
  if (L && L.def.drawTop) L.def.drawTop(L);
  if (S.tearT > 0) {
    S.tearT -= dt;
    for (let i = 0; i < 7; i++) {
      const y = rand(0, H), h = rand(6, 50);
      try { ctx.drawImage(cv, 0, y * DPR, cv.width, h * DPR, rand(-50, 50), y, W, h); } catch (e) { /* tainted? never */ }
    }
  }
  if (S.flashA > 0) S.flashA -= dt;
}
function updateMeter(dt) {
  const L = S.L;
  const target = L ? clamp(L.showP != null ? L.showP : L.p, 0, 1) : S.ended ? 1 : 0;
  if (target < S.lastP - 0.04 && L) { meterEl.classList.add("drop"); setTimeout(() => meterEl.classList.remove("drop"), 300); }
  S.lastP = target;
  S.mp += (target - S.mp) * Math.min(1, dt * 6);
  ringEl.style.strokeDashoffset = (RING_C * (1 - S.mp)).toFixed(1);
  const m = meterCenter();
  const a = Math.atan2(S.py - m.y, S.px - m.x), d = Math.min(9, Math.hypot(S.px - m.x, S.py - m.y) / 30);
  irisEl.setAttribute("transform", `translate(${(Math.cos(a) * d).toFixed(1)},${(Math.sin(a) * d * 0.6).toFixed(1)})`);
  pupilEl.setAttribute("r", (6 + 8 * S.mp).toFixed(1));
  meterEl.classList.toggle("full", S.mp > 0.97);
  if (Math.random() < dt * 0.25) blinkMeter();
  if (bigEyeEl.classList.contains("on")) {
    const bx = (S.px / W - 0.5) * 50, by = (S.py / H - 0.5) * 30;
    bigIrisEl.setAttribute("transform", `translate(${bx.toFixed(1)},${by.toFixed(1)})`);
  }
}
function blinkMeter() { meterEl.classList.remove("blink"); void meterEl.getBoundingClientRect(); meterEl.classList.add("blink"); }
function pulseMeter() { meterEl.classList.remove("pulse"); void meterEl.getBoundingClientRect(); meterEl.classList.add("pulse"); }

// ---------- main loop ----------
let lastFrame = performance.now(), lastNoise = -1;
function tick(dt) {
  S.clock += dt;
  S.worldRot += (S.worldRotT - S.worldRot) * Math.min(1, dt * 2.5);
  S.worldScale += (S.worldScaleT - S.worldScale) * Math.min(1, dt * 3);
  S.speed = (S.calm ? 0.45 : 1) * (1 - 0.9 * S.calmProx) * (1 + S.boost);
  S.noise = 1 - 0.9 * S.calmProx;
  if (Math.abs(S.noise - lastNoise) > 0.01) { document.body.style.setProperty("--noise", S.noise.toFixed(2)); lastNoise = S.noise; }

  if (S.running && S.L) {
    S.runClock += dt;
    S.saveT -= dt;
    if (S.saveT <= 0) { S.saveT = 3; saveRun(); }
  }
  const L = S.L;
  if (L) {
    L.t += dt;
    for (const w of L.words) {
      if (!w.spin) continue;
      w.spinT = (w.spinT || 0) - dt;
      if (w.spinT <= 0) { w.spinT = S.calm ? 0.5 : w.spinRate || 0.12; w.i = (w.i + 1) % w.opts.length; paintWord(w); }
    }
    if (L.def.update) L.def.update(L, dt);
    L.p = clamp(L.p, 0, 1);
    if (L.p >= 1 && !L.solving) { L.solving = true; solveLayer(); }
  }
  for (const o of objs.slice()) moveObj(o, dt);
  if (S.running) {
    if (S.clockLieT > 0) { S.clockLieT -= dt; timerEl.textContent = pick(["99:99", "-0:07", fmt(rand(0, 9999)), "??:??", "NOW", "∞"]); }
    else timerEl.textContent = fmt(S.runClock);
  }

  if (S.cursorMode) {
    const k = S.cursorMode === "SLOW" ? Math.min(1, dt * 1.8) : 1;
    S.cx += (S.px - S.cx) * k; S.cy += (S.py - S.cy) * k;
    const rot = S.cursorMode === "UPSIDE DOWN" ? " rotate(180deg)" : "";
    cursorEl.style.transform = `translate(${S.cx}px,${S.cy}px)${rot}`;
  }
  updateChaos(dt);
  updateTitle(dt);
  updateHints();
}
function frame(ts) {
  const dt = Math.min(0.05, Math.max(0, (ts - lastFrame) / 1000));
  lastFrame = ts;
  if (!S.test) {
    tick(dt);
    draw(dt);
    updateMeter(dt);
    Snd.update(S.mp);
  }
  requestAnimationFrame(frame);
}

// ---------- input ----------
const isUi = (t) => t && t.closest && t.closest(".word, .word-input, .tool, .overlay-ui, .brand");
function pointerDown(x, y, target, type = "mouse") {
  S.px = x; S.py = y; S.pointerType = type;
  if (!S.running) return;
  if (isUi(target)) return;
  S.clicks++;
  S.lastInput = now();
  if (!S.test) rings.push({ x, y, r: 4, v: 300, life: 0.5, max: 0.5, col: "255,226,58", w: 2 });
  Snd.blip();
  const L = S.L;
  if (target && target.classList && target.classList.contains("fake")) {
    if (!(L && L.def.onFake && L.def.onFake(L, target.textContent.trim(), target) === true)) fakeReact(target);
  }
  if (!L) return;
  S.down = { x, y, t: now(), path: [{ x, y, t: now() }] };
  if (L.def.onInput) L.def.onInput(L, "tap");
  if (S.L !== L) return;
  const m = meterCenter();
  if (L.def.onEye && Math.hypot(x - m.x, y - m.y) < m.r) { L.def.onEye(L); if (S.L !== L) return; }
  const p = toWorld(x, y);
  if (L.def.drag) {
    const o = hitObj(p.x, p.y, (q) => q.draggable);
    if (o) { S.dragObj = o; o.held = true; o.vx = 0; o.vy = 0; }
  }
  if (L.def.onTap) L.def.onTap(L, p.x, p.y, x, y);
}
function pointerMove(x, y, type = "mouse") {
  if (Math.hypot(x - S.px, y - S.py) > 1.5) S.lastMove = now();
  S.px = x; S.py = y; S.pointerType = type;
  if (!S.test) { trail.push({ x, y, t: performance.now() / 1000 }); if (trail.length > 24) trail.shift(); }
  const L = S.L;
  if (S.down) { S.down.path.push({ x, y, t: now() }); if (S.down.path.length > 600) S.down.path.shift(); }
  if (S.dragObj) { const p = toWorld(x, y); S.dragObj.x = p.x; S.dragObj.y = p.y; }
  if (L && L.def.onMove) L.def.onMove(L, x, y);
}
function pointerUp(x, y) {
  const L = S.L, d = S.down;
  S.down = null;
  if (S.dragObj) {
    const o = S.dragObj; S.dragObj = null; o.held = false;
    if (L && L.def.onDrop) L.def.onDrop(L, o);
  }
  if (L && d && L.def.onUp) L.def.onUp(L, { dur: now() - d.t, path: d.path, x, y, x0: d.x, y0: d.y });
}
window.addEventListener("pointermove", (e) => pointerMove(e.clientX, e.clientY, e.pointerType), { passive: true });
window.addEventListener("pointerdown", (e) => pointerDown(e.clientX, e.clientY, e.target, e.pointerType));
window.addEventListener("pointerup", (e) => pointerUp(e.clientX, e.clientY));
window.addEventListener("pointercancel", (e) => pointerUp(e.clientX, e.clientY));
function keyDown(e) {
  if (!S.running || e.repeat) return;
  if (e.target && e.target.tagName === "INPUT") return;
  if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (e.target && e.target.classList && e.target.classList.contains("word") && (e.key === "Enter" || e.key === " ")) return;
  S.clicks++;
  S.lastInput = now();
  const L = S.L;
  if (!L) return;
  if (L.def.onInput) L.def.onInput(L, "key");
  if (S.L !== L) return;
  if (L.def.answers && e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
    L.buf = (L.buf + e.key.toUpperCase()).slice(-30);
    typedEl.textContent = L.buf.slice(-14);
    Snd.tick();
    const ans = L.def.answers(L).map((a) => a.replace(/[^A-Z0-9]/g, ""));
    if (ans.some((a) => L.buf.endsWith(a))) L.p = 1;
  }
  if (L.def.onKey) L.def.onKey(L, e);
}
window.addEventListener("keydown", keyDown);
// leaving the page (or the window) is an input too
let awayAt = 0;
function setAway(away) {
  const L = S.L;
  if (away) awayAt = performance.now();
  if (L && L.def.onAway) L.def.onAway(L, away, (performance.now() - awayAt) / 1000);
}
document.addEventListener("visibilitychange", () => setAway(document.hidden));
window.addEventListener("blur", () => setAway(true));
window.addEventListener("focus", () => setAway(false));
document.documentElement.addEventListener("mouseleave", () => { const L = S.L; if (L && L.def.onLeave) L.def.onLeave(L); });
window.addEventListener("pagehide", saveRun);

// ---------- toolbar ----------
const calmBtn = $("calm-btn"), muteBtn = $("mute-btn");
function applyCalm() {
  document.body.classList.toggle("calm", S.calm);
  calmBtn.classList.toggle("on", S.calm);
  $("splash-calm").checked = S.calm;
  store.set("mysterle-calm", S.calm);
}
function applyMute() {
  muteBtn.classList.toggle("off", S.muted);
  store.set("mysterle-muted", S.muted);
  Snd.setMuted(S.muted);
}
function toolUsed(name) { const L = S.L; if (L && L.def.onTool) L.def.onTool(L, name); }
calmBtn.addEventListener("click", (e) => {
  e.currentTarget.blur();
  S.calm = !S.calm; applyCalm();
  if (!S.test) whisper(S.calm ? "calm." : "chaos.", 1.5);
  toolUsed("calm");
});
muteBtn.addEventListener("click", (e) => { e.currentTarget.blur(); S.muted = !S.muted; Snd.init(); applyMute(); toolUsed("mute"); });
$("hint-btn").addEventListener("click", (e) => { e.currentTarget.blur(); useHint(); });
$("brand").addEventListener("click", (e) => {
  e.currentTarget.blur();
  const L = S.L;
  if (L && L.def.onBrand) { L.def.onBrand(L); return; }
  Snd.glitch(); popText(90, 70, pick(["THAT'S MY NAME", "DON'T", "HI", "?"]), "#c9b8ff");
});
$("splash-calm").addEventListener("change", (e) => { S.calm = e.target.checked; applyCalm(); });

// ---------- codex ----------
function openCodex() {
  const c = codex();
  const grid = $("codex-grid");
  grid.innerHTML = "";
  LAYER_DEFS.forEach((d) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cx" + (c[d.id] ? " got t" + d.tier : "");
    b.textContent = c[d.id] ? String(d.n) : "?";
    b.addEventListener("click", () => {
      $("codex-detail").textContent = c[d.id] ? `#${d.n} · ${d.reveal} (understood in mystery #${c[d.id]})` : `#${d.n} · not understood yet.`;
    });
    grid.appendChild(b);
  });
  $("codex-count").textContent = `${Object.keys(c).length} / ${LAYER_DEFS.length} rules understood`;
  $("codex-detail").textContent = "tap a cell.";
  $("codex").hidden = false;
}
$("codex-btn").addEventListener("click", (e) => { e.currentTarget.blur(); openCodex(); });
$("codex-close").addEventListener("click", () => { $("codex").hidden = true; });

// ---------- splash & end ----------
function renderSplash() {
  const run = loadRun();
  $("num").textContent = "#" + NUM;
  $("splash-num").textContent = `MYSTERY #${NUM}`;
  $("splash-name").textContent = DAY_NAME;
  $("splash-anoms").textContent = "today's anomalies: " + [...ANOMS].map((k) => ANOMALIES[k]).join(" · ");
  $("splash-codex").textContent = `▦ ${Object.keys(codex()).length} / ${LAYER_DEFS.length} rules understood`;
  const enter = $("enter"), abyss = $("abyss-btn");
  if (run.done) {
    const [rank] = rankFor(run.elapsed, run.hints);
    $("splash-status").textContent = `solved in ${fmt(run.elapsed)} · ${rank} · next mystery in ${untilNext()}`;
    enter.textContent = "▶ RESULT";
    abyss.hidden = false;
  } else if (run.idx > 0) {
    $("splash-status").textContent = `you stopped at layer ${run.idx + 1} of ${DAILY.length} · ${fmt(run.elapsed)}`;
    enter.textContent = "▶ CONTINUE";
    abyss.hidden = true;
  } else {
    $("splash-status").textContent = `${DAILY.length} layers · one mystery a day · it waits for you`;
    enter.textContent = "▶ BEGIN";
    abyss.hidden = true;
  }
}
function hideSplash() {
  $("splash").classList.add("gone");
  setTimeout(() => { $("splash").hidden = true; }, 800);
}
$("enter").addEventListener("click", () => {
  Snd.init();
  hideSplash();
  if (loadRun().done) { S.ended = true; showEnd(); return; }
  startRun("daily");
});
function enterAbyss() {
  Snd.init();
  hideSplash();
  $("end").hidden = true;
  S.calmProx = 0;
  startRun("abyss");
}
$("abyss-btn").addEventListener("click", enterAbyss);
$("end-abyss").addEventListener("click", enterAbyss);
$("end-codex-btn").addEventListener("click", openCodex);
$("share-btn").addEventListener("click", () => copyText(shareText(), $("share-btn")));
$("splash-codex").addEventListener("click", openCodex);

// ---------- test harness: plays every layer with its own cheat() ----------
// In the console: await __testAll()  →  list of layers that did not solve
const T = {
  async step(sec) { const n = Math.max(1, Math.round(sec / (1 / 30))); for (let i = 0; i < n; i++) { tick(1 / 30); if (!S.L) return; } },
  word(id) { return typeof id === "number" ? S.L.words[id] : wordById(S.L, id); },
  tapWord(id, letter) { const w = T.word(id); wordTap(w, letter); },
  cycleTo(id, text) {
    for (let g = 0; g < 60 && S.L && wordById(S.L, id) && get(S.L, id) !== text; g++) wordTap(wordById(S.L, id));
    return !S.L || !wordById(S.L, id) || get(S.L, id) === text;
  },
  remove(id) { const w = T.word(id); removeWord(S.L, w, null); },
  swap(a, b) { swapWords(S.L, T.word(a), T.word(b)); },
  edit(id, text) { const L = S.L, w = T.word(id); w.custom = text; if (L.def.onWord) L.def.onWord(L, w, "type"); if (S.L === L) checkAnswer(L, text); if (S.L === L) renderWords(); },
  type(str) { for (const ch of str) keyDown({ key: ch, target: document.body, repeat: false }); },
  key(k) { keyDown({ key: k, target: document.body, repeat: false }); },
  tap(x, y) { pointerDown(x, y, cv); pointerUp(x, y); },
  tapWorld(o) { const p = toScreen(o.x, o.y); T.tap(p.x, p.y); },
  down(x, y) { pointerDown(x, y, cv); },
  up(x, y) { pointerUp(x != null ? x : S.px, y != null ? y : S.py); },
  move(x, y) { pointerMove(x, y); },
  async hold(x, y, sec) { T.down(x, y); await T.step(sec); if (S.L) T.up(x, y); },
  tool(name) { ({ hint: $("hint-btn"), calm: calmBtn, mute: muteBtn, brand: $("brand") })[name].click(); },
  eye() { const m = meterCenter(); T.tap(m.x, m.y); },
  away(sec = 2) { setAway(true); awayAt -= sec * 1000; setAway(false); },
  drag(o, x, y) { objs.splice(objs.indexOf(o), 1); objs.push(o); const s = toScreen(o.x, o.y); T.down(s.x, s.y); const t = toScreen(x, y); T.move(t.x, t.y); T.up(t.x, t.y); },
};
async function __testOne(id, salt = "test") {
  const d = BY_ID[id];
  S.test = true; S.running = true; S.mode = "daily"; S.idx = 3;
  const calm = S.calm, muted = S.muted;
  const L = makeLayer(d, salt);
  let err = null;
  try {
    beginLayer(L);
    await d.cheat(L, T);
    await T.step(12);
  } catch (e) { err = String(e && e.stack || e); }
  const ok = !!L.solved;
  if (S.L === L) { if (d.teardown) d.teardown(L); resetWorld(); S.L = null; }
  S.calm = calm; S.muted = muted; applyCalm(); applyMute();
  S.test = false; S.running = false;
  return { id, n: d.n, ok, err, t: L.t.toFixed(1) };
}
async function __testAll(salt) {
  const res = [];
  for (const d of LAYER_DEFS) res.push(await __testOne(d.id, salt));
  bar.innerHTML = ""; objs.length = 0;
  return { total: res.length, passed: res.filter((r) => r.ok).length, failed: res.filter((r) => !r.ok) };
}
window.__testAll = __testAll;
window.__testOne = __testOne;

// ---------- boot (called after the layer files have loaded) ----------
function boot() {
  buildSequences();
  $("tick-a").textContent = TICKER_A.repeat(3);
  $("tick-b").textContent = TICKER_B.repeat(6);
  if (ANOMS.has("slant")) bar.style.setProperty("--tilt", "-5deg");
  applyCalm();
  applyMute();
  renderSplash();
  renderPips();
  requestAnimationFrame(frame);
}
