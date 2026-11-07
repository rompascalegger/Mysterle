"use strict";
// MYSTERLE: the game is to understand the game.
// Nine layers. Each one has a big sentence made of words you can tap (they change),
// drag (they move, some can be thrown away) or, later, type into. Every layer hides a
// rule; the eye at the bottom fills up when you are doing the right thing.

const VERSION = "1.0.0";
const $ = (id) => document.getElementById(id);

// ---------- small helpers ----------
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const now = () => performance.now() / 1000;
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

// ---------- the daily mystery ----------
const EPOCH = Date.UTC(2026, 10, 7); // 7 Nov 2026 is mystery #1
function mysteryNumber() {
  const d = new Date();
  return Math.max(1, Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000) + 1);
}
const NUM = mysteryNumber();
const sr = mulberry32((NUM * 7919 + 1337) >>> 0);
const ANSWERS = ["LANTERN", "MOTH", "VELVET", "ECHO", "THIMBLE", "ORBIT", "MARROW", "QUILL", "HOLLOW", "EMBER",
  "WILLOW", "CIPHER", "TIDE", "RAVEN", "PRISM", "FABLE", "LICHEN", "OPAL", "COMET", "GLOVE"];
const SEED = {
  eyes: 5 + Math.floor(sr() * 5),          // layer 4: how many eyes (5..9)
  tris: sr() < 0.5 ? 2 : 4,                // layer 4: triangles
  answer: ANSWERS[Math.floor(sr() * ANSWERS.length)], // layer 6
  qx: 0.16 + 0.68 * sr(), qy: 0.46 + 0.36 * sr(),     // layer 7: the quiet place
  dx: 0.14 + 0.72 * sr(), dy: 0.48 + 0.34 * sr(),     // layer 5: the door
  beat: 0.56 + 0.1 * sr(),                 // layer 8: seconds per beat
};

// ---------- text pools ----------
const PHRASES = ["WHY?", "IT'S FINE", "LOADING 147%", "ERROR: MEANING NOT FOUND", "DON'T LOOK", "LOOK", "are you sure?", "↻",
  "→", "← NOT THIS", "THE RULES CHANGED", "CORRECT", "INCORRECT", "???", "you're close", "you're not close", "BREATHE",
  "IT SEES YOU", "ALMOST", "NEVER", "LEVEL UP?", "SIGNAL LOST", "∞", "PRESS NOTHING", "WAIT", "FASTER", "SLOWER",
  "this is not a hint", "THIS IS A HINT", "404", "OK", "hmm", "bzzt", "REMAIN CALM", "UNDERSTAND?", "YES", "NO", "maybe",
  "YOU ARE HERE", "WRONG WAY", "PLEASE HOLD", "↑↑↓↓", "SCORE: -3", "+1", "NEW RULE", "OLD RULE", "IGNORE THIS",
  "DID YOU SEE THAT?", "AGAIN", "AND AGAIN", "SYSTEM CALM", "hello?", "!!!", "SEVEN", "TOO LATE", "NOT YET"];
const GLYPHS = ["✶", "☉", "⌘", "◬", "⟁", "⧗", "☍", "✺", "⌬", "⍟", "◈", "⊛", "☊", "♒", "⚘", "⌖", "⟡", "⊗", "▲", "●",
  "■", "◆", "✦", "☽", "⚡", "✖", "⌀", "∴", "⋈", "⎔", "☄", "⚙", "♜", "☿", "♆"];
const FAKE_BTNS = ["CONTINUE", "OK", "SKIP ▶", "CLICK", "NEXT", "HELP", "UNDO", "START", "YES", "NO", "?", "RESET", "SOLVE", "ACCEPT"];
const RETORTS = ["NO.", "WRONG BUTTON", "THANK YOU", "+1 ???", "NICE TRY", "THAT DID NOTHING", "THAT DID SOMETHING", "OUCH",
  "✓", "✗", "AGAIN?", "HA", "NOTED.", "REPORTED.", "...", "WHY"];
const BAR_LABELS = ["installing doubt", "loading rules", "updating reality", "deleting hints", "counting eyes", "buffering",
  "compiling silence", "unloading meaning"];
const WIN_TITLES = ["SYSTEM", "Mysterle.exe", "WARNING", "NOTICE", "error", "C:\\RULES"];
const WIN_TEXT = ["Everything is fine.", "The rules have been updated.", "Are you still there?", "Do not trust the windows.",
  "This window is not important.", "A hint was found and deleted.", "Meaning could not be loaded.", "Press OK to continue nothing."];
const LIE_WORDS = ["NOTHING", "YOU", "LIE", "WAIT", "DON'T", "ALWAYS", "NEVER", "EAT", "HELP", "???", "RUN", "BLUE", "ME", "LATER"];
const LIES = ["YOU ARE DOING GREAT", "THIS IS FINE", "THE RULES HAVE CHANGED", "IGNORE ME", "WRONG SENTENCE", "LOOK BEHIND YOU"];
const TITLE_GLITCH = ["MYSTERLE", "MY5TERLE", "M?STERLE", "ᴍʏsᴛᴇʀʟᴇ", "M Y S T E R L E", "▒▒▒▒▒▒▒▒", "ELRETSYM", "MYSTER…"];
const TICKER_A = "WELCOME TO MYSTERLE ✶ NOTHING IS WRONG ✶ PLEASE REMAIN CONFUSED ✶ THE RULES HAVE BEEN UPDATED ✶ THE RULES HAVE BEEN UPDATED ✶ YOUR PROGRESS IS BEING WATCHED ✶ DO NOT READ THIS TICKER ✶ TODAY'S FORECAST: EYES ✶ THE SENTENCE IS ALWAYS RIGHT ✶ THE SENTENCE IS NEVER RIGHT ✶ ";
const TICKER_B = "0x3F ◬ 7 ⟁ 12 ⧗ 9.81 ☉ ERR ⌬ 404 ✺ 1/∞ ⌘ 33 ◈ NULL ⊛ 2+2=5 ☍ 07:77 ⍟ 88 ⟡ ?? ✶ 101 ⊗ ";

// ---------- shapes and colors ----------
const COLORS = { RED: "#ff2a3d", BLUE: "#2f7bff", GREEN: "#2bff88", YELLOW: "#ffe23a", PINK: "#ff4fd8" };
const COLOR_KEYS = Object.keys(COLORS);
const SHAPE_OF = { SQUARES: "square", CIRCLES: "circle", TRIANGLES: "tri", EYES: "eye", STARS: "star" };
const NUMVAL = { ZERO: 0, ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5, SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9, TEN: 10,
  ELEVEN: 11, TWELVE: 12, TWENTY: 20 };

// ---------- DOM ----------
const cv = $("cv"), ctx = cv.getContext("2d");
const bar = $("bar"), floatLayer = $("floaters"), popsEl = $("pops"), whisperEl = $("whisper"), typedEl = $("typed");
const meterEl = $("meter"), ringEl = $("m-ring"), irisEl = $("m-iris"), pupilEl = $("m-pupil");
const timerEl = $("timer"), pipsEl = $("pips"), revealEl = $("reveal"), flashEl = $("flash"), veilEl = $("veil");
const cursorEl = $("cursor"), countdownEl = $("countdown"), bigEyeEl = $("bigeye"), bigIrisEl = $("be-iris");
const RING_C = 2 * Math.PI * 54;

// ---------- state ----------
const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const S = {
  started: false, running: false, ended: false,
  layer: 0, L: null, t0: 0, endTime: 0,
  clicks: 0, changes: 0, hints: 0, hintLevel: 0,
  calm: store.get("mysterle-calm", reducedMotion), muted: store.get("mysterle-muted", false),
  px: innerWidth / 2, py: innerHeight / 2, pointerType: "mouse", lastMove: 0, lastInput: 0, dragging: false,
  speed: 1, worldSpeed: 1, worldRot: 0, worldRotT: 0, worldScale: 1, worldScaleT: 1, worldHidden: false,
  skyMode: "NORMAL", calmProx: 0, boost: 0, noise: 1, hue: 260, hueJump: 0, sigRot: 0,
  mp: 0, lastP: 0, flashA: 0, cursorMode: null, cx: 0, cy: 0,
};
let W = innerWidth, H = innerHeight;
const objs = [], parts = [], rings = [], trail = [];
const swirl = Array.from({ length: 140 }, () => ({
  a: rand(0, 6.283), R: rand(0.04, 1), w: rand(0.1, 0.9) * (Math.random() < 0.5 ? -1 : 1),
  s: rand(1, 3.5), h: rand(0, 120), al: rand(0.25, 0.9),
}));

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  cv.style.width = W + "px"; cv.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const o of objs) { o.x = clamp(o.x, o.r, W - o.r); o.y = clamp(o.y, o.r, H - o.r); }
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
    const c = this.ctx; if (!c || S.muted) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur = 0.12, freq = 1200, vol = 0.12) {
    const c = this.ctx; if (!c || S.muted || !this.noiseBuf) return;
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
  update(prog) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime;
    const lvl = (S.running ? 0.055 : 0.02) * this.droneLevel * (1 - 0.95 * S.calmProx) * (S.calm ? 0.55 : 1) * (1 + S.boost * 0.6);
    this.droneG.gain.setTargetAtTime(lvl, t, 0.3);
    this.drones.forEach((o, i) => o.frequency.setTargetAtTime(this.base[i] * this.dronePitch, t, 0.5));
    this.progG.gain.setTargetAtTime(prog > 0.01 && S.L ? 0.018 + prog * 0.03 : 0, t, 0.1);
    this.progO.frequency.setTargetAtTime(200 + prog * 800, t, 0.1);
  },
};

// ---------- world objects (drawn on the canvas) ----------
function mk(shape, color, o = {}) {
  const r = o.r != null ? o.r : rand(14, 26);
  const a = rand(0, Math.PI * 2), base = o.base != null ? o.base : rand(40, 120);
  return Object.assign({
    shape, color, r, x: rand(r, W - r), y: rand(r, H - r), vx: Math.cos(a) * base, vy: Math.sin(a) * base, base,
    rot: rand(0, 6.28), vr: rand(-1.5, 1.5), spin: 0, blink: 0, blinkT: rand(1, 5), alpha: 1, tw: rand(1, 4),
  }, o, { r });
}
function scatter(n, o = {}) {
  const shapes = Object.values(SHAPE_OF);
  for (let i = 0; i < n; i++) objs.push(mk(pick(shapes), pick(COLOR_KEYS), Object.assign({}, o)));
}
function toWorld(x, y) {
  const c = Math.cos(-S.worldRot), s = Math.sin(-S.worldRot), dx = x - W / 2, dy = y - H / 2;
  return { x: (dx * c - dy * s) / S.worldScale + W / 2, y: (dx * s + dy * c) / S.worldScale + H / 2 };
}
function moveObj(o, dt) {
  const sp = S.speed * S.worldSpeed * (o.slow ? 0.08 : 1);
  if (o.flee) {
    const p = toWorld(S.px, S.py), dx = o.x - p.x, dy = o.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (d < o.flee) { const f = (1 - d / o.flee) * 2400 * dt; o.vx += (dx / d) * f; o.vy += (dy / d) * f; }
  }
  if (o.avoid) {
    const dx = o.x - o.avoid.x, dy = o.y - o.avoid.y, d = Math.hypot(dx, dy) || 1, R = o.avoid.r;
    if (d < R) { const f = (1 - d / R) * 1100 * dt; o.vx += (dx / d) * f; o.vy += (dy / d) * f; }
  }
  const v = Math.hypot(o.vx, o.vy) || 1;
  if (v > o.base) { const k = Math.max(o.base / v, 1 - dt * 1.3); o.vx *= k; o.vy *= k; }
  o.x += o.vx * dt * sp; o.y += o.vy * dt * sp;
  o.rot += (o.vr + o.spin) * dt * sp; o.spin *= Math.pow(0.05, dt);
  if (o.alpha < 1) o.alpha = Math.min(1, o.alpha + dt * 2);
  if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx); }
  if (o.x > W - o.r) { o.x = W - o.r; o.vx = -Math.abs(o.vx); }
  if (o.y < o.r) { o.y = o.r; o.vy = Math.abs(o.vy); }
  if (o.y > H - o.r) { o.y = H - o.r; o.vy = -Math.abs(o.vy); }
  if (o.shape === "eye") {
    o.blinkT -= dt;
    if (o.blinkT <= 0) { o.blink = 1; o.blinkT = rand(1.2, 5.5); }
    o.blink = Math.max(0, o.blink - dt * 4.5);
  }
  if (o.shape === "door") o.scale += ((o.scaleT || 1) - o.scale) * Math.min(1, dt * 4);
}
function hitObj(x, y, filter) {
  const pad = S.pointerType === "touch" ? 14 : 6;
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i];
    if (o.hidden || (filter && !filter(o))) continue;
    if (o.shape === "door") {
      const w = o.r * o.scale, h = o.r * 1.7 * o.scale;
      if (Math.abs(x - o.x) < w + pad && Math.abs(y - o.y) < h + pad) return o;
    } else if (Math.hypot(x - o.x, y - o.y) < o.r * 1.2 + pad) return o;
  }
  return null;
}
function popObj(o) {
  const col = COLORS[o.color] || "#fff";
  for (let i = 0; i < 18; i++) {
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
  if (o.twinkle) alpha *= 0.35 + 0.65 * Math.abs(Math.sin(performance.now() / 1000 * o.tw));
  ctx.globalAlpha = alpha;
  const col = COLORS[o.color] || o.color;
  ctx.fillStyle = col;
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
    case "door": drawDoor(o); break;
    case "orb": drawOrb(o); break;
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
  }
}
function drawDoor(o) {
  const w = o.r * o.scale, h = o.r * 1.7 * o.scale, t = performance.now() / 1000;
  ctx.rotate(Math.sin(t * 1.3) * 0.05 + (o.flip ? Math.PI : 0));
  if (o.open) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, h * 2.6);
    g.addColorStop(0, "rgba(255,250,210,.75)"); g.addColorStop(1, "rgba(255,250,210,0)");
    ctx.fillStyle = g; ctx.fillRect(-h * 2.6, -h * 2.6, h * 5.2, h * 5.2);
  }
  ctx.fillStyle = "#2b1406"; ctx.fillRect(-w - 5, -h - 5, w * 2 + 10, h * 2 + 5);
  if (o.open) {
    ctx.fillStyle = "#fffbe0"; ctx.fillRect(-w, -h, w * 2, h * 2);
    ctx.fillStyle = o.red ? "#b0101c" : "#8a4b22";
    ctx.beginPath(); ctx.moveTo(-w, -h); ctx.lineTo(-w * 0.45, -h * 1.1); ctx.lineTo(-w * 0.45, h * 1.05); ctx.lineTo(-w, h); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = o.red ? "#d0182a" : "#8a4b22"; ctx.fillRect(-w, -h, w * 2, h * 2);
    ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 2;
    ctx.strokeRect(-w * 0.7, -h * 0.85, w * 1.4, h * 0.7); ctx.strokeRect(-w * 0.7, h * 0.1, w * 1.4, h * 0.7);
    ctx.fillStyle = "#ffcf4a"; ctx.beginPath(); ctx.arc(w * 0.62, h * 0.05, Math.max(2.5, w * 0.12), 0, 7); ctx.fill();
  }
  if (o.rattle > 0) o.rattle -= 1 / 60;
}
function drawOrb(o) {
  const t = performance.now() / 1000, r = o.r * (1 + Math.sin(t * 5) * 0.08);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, "#fff"); g.addColorStop(0.4, "#ff4fd8"); g.addColorStop(1, "rgba(255,79,216,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.fillStyle = "#000"; ctx.font = `${Math.round(r * 0.32)}px Bungee, Impact, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("CLICK ME", 0, 0);
}

// ---------- the sentence ----------
function W_(opts, flags = {}) { return Object.assign({ opts, i: 0, custom: null }, flags); }
const wtext = (w) => (w.custom != null ? w.custom : w.opts[w.i]);
function get(L, id) { const w = L.words.find((x) => x.id === id); return w ? wtext(w) : null; }
function sentence(L) { return L.words.map(wtext); }

function renderWords(enter) {
  bar.innerHTML = "";
  const L = S.L;
  if (!L) return;
  L.words.forEach((w, k) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "word" + (enter ? " word-in" : "");
    el.textContent = wtext(w);
    el._w = w; w.el = el;
    el.style.setProperty("--d", (-Math.random() * 2.6).toFixed(2) + "s");
    el.style.setProperty("--r", rand(-2.5, 2.5).toFixed(1) + "deg");
    el.style.setProperty("--ad", (k * 0.13).toFixed(2) + "s");
    el.addEventListener("animationend", (e) => { if (e.animationName !== "jiggle") el.classList.remove("cycled", "wob", "word-in"); });
    bindWord(el, w);
    bar.appendChild(el);
  });
}
function bindWord(el, w) {
  el.addEventListener("pointerdown", (e) => {
    if (w.editing || !S.L) return;
    e.preventDefault();
    S.pointerType = e.pointerType;
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* old browsers */ }
    const st = { x: e.clientX, y: e.clientY, drag: false };
    const move = (ev) => {
      const dx = ev.clientX - st.x, dy = ev.clientY - st.y;
      if (!st.drag && Math.hypot(dx, dy) > 12) { st.drag = true; S.dragging = true; el.classList.add("dragging"); }
      if (st.drag) el.style.transform = `translate(${dx}px,${dy}px) rotate(${dx * 0.05}deg)`;
    };
    const up = (ev) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      S.dragging = false;
      if (!st.drag) { if (ev.type === "pointerup") wordTap(w); return; }
      dropWord(w, el, ev.clientX, ev.clientY);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  });
  // Keyboard users can still change words
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); wordTap(w); }
  });
}
function wordTap(w) {
  const L = S.L;
  if (!L) return;
  if (w.editable) { startEdit(w); return; }
  if (w.heavy || w.opts.length < 2) {
    w.el.classList.remove("wob"); void w.el.offsetWidth; w.el.classList.add("wob");
    Snd.thud();
    if (L.def.onHeavy) L.def.onHeavy(L, w);
    return;
  }
  w.i = (w.i + 1) % w.opts.length;
  w.custom = null;
  S.changes++;
  Snd.cycle();
  if (L.def.onWord) L.def.onWord(L, w, "cycle");
  renderWords();
  if (w.el) w.el.classList.add("cycled");
}
function dropWord(w, el, x, y) {
  const L = S.L;
  if (!L) return;
  el.style.visibility = "hidden";
  const target = document.elementsFromPoint(x, y).find((n) => n !== el && n.classList && n.classList.contains("word") && n._w);
  el.style.visibility = "";
  const r = bar.getBoundingClientRect();
  const outside = y < r.top - 70 || y > r.bottom + 70 || x < r.left - 40 || x > r.right + 40;
  if (target) {
    const a = L.words.indexOf(w), b = L.words.indexOf(target._w);
    L.words[a] = target._w; L.words[b] = w;
    S.changes++; Snd.cycle();
    if (L.def.onWord) L.def.onWord(L, w, "move");
    renderWords();
  } else if (outside && w.removable) {
    const rect = el.getBoundingClientRect(), c = document.createElement("div");
    c.className = "falling"; c.textContent = wtext(w);
    c.style.left = rect.left + "px"; c.style.top = rect.top + "px";
    c.style.fontSize = getComputedStyle(bar).fontSize;
    c.style.setProperty("--fx", rand(-120, 120) + "px"); c.style.setProperty("--fr", rand(-540, 540) + "deg");
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1700);
    L.words.splice(L.words.indexOf(w), 1);
    S.changes++; Snd.whoosh();
    if (L.def.onWord) L.def.onWord(L, w, "remove");
    renderWords();
  } else {
    if (outside) { popText(x, y, pick(["IT CLINGS.", "IT WON'T GO.", "STAYS."]), "#ffb3c4"); Snd.thud(); }
    renderWords();
  }
}
function startEdit(w) {
  if (w.editing) return;
  w.editing = true;
  const inp = document.createElement("input");
  inp.className = "word-input";
  inp.value = wtext(w);
  inp.maxLength = 18;
  inp.size = Math.max(3, inp.value.length + 1);
  inp.setAttribute("autocapitalize", "characters");
  inp.setAttribute("autocomplete", "off");
  inp.setAttribute("spellcheck", "false");
  inp.setAttribute("aria-label", "edit this word");
  w.el.replaceWith(inp);
  w.el = inp;
  inp.focus(); inp.select();
  const commit = () => {
    if (!w.editing) return;
    w.editing = false;
    const v = inp.value.toUpperCase().replace(/[^A-Z0-9 '?!.-]/g, "").trim();
    if (v && v !== wtext(w)) { w.custom = v; S.changes++; Snd.cycle(); }
    const L = S.L;
    if (L && L.def.onWord) L.def.onWord(L, w, "type");
    if (S.L === L) renderWords();
  };
  inp.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === "Escape") inp.blur(); });
  inp.addEventListener("input", () => {
    inp.size = Math.max(3, inp.value.length + 1);
    Snd.tick();
    const L = S.L;
    if (L && L.def.onType) L.def.onType(L, inp.value.toUpperCase().trim());
  });
  inp.addEventListener("blur", commit);
  inp.addEventListener("pointerdown", (e) => e.stopPropagation());
}
// The game itself lies about the sentence, for a moment
function wordLie(whole) {
  const L = S.L;
  if (!L || S.dragging || L.words.some((w) => w.editing)) return;
  const els = [...bar.querySelectorAll(".word")];
  if (!els.length) return;
  if (whole) {
    const fake = pick(LIES).split(" ");
    els.forEach((el, i) => { el.textContent = fake[i] || "…"; el.classList.add("lie"); });
  } else {
    const el = pick(els);
    el.textContent = pick(LIE_WORDS); el.classList.add("lie");
  }
  Snd.glitch();
  setTimeout(() => els.forEach((el) => { if (el._w && !el._w.editing) el.textContent = wtext(el._w); el.classList.remove("lie"); }), whole ? 420 : 380);
}

// ---------- little texts ----------
function popText(x, y, text, color = "#fff", big = false) {
  const el = document.createElement("div");
  el.className = "pop" + (big ? " big" : "");
  el.textContent = text; el.style.left = x + "px"; el.style.top = y + "px"; el.style.color = color;
  popsEl.appendChild(el);
  setTimeout(() => el.remove(), big ? 2300 : 1100);
}
let whisperTimer = 0, whisperTyping = 0;
function whisper(text, hold = 7) {
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
function flash() { flashEl.classList.remove("on"); void flashEl.offsetWidth; flashEl.classList.add("on"); }
function shake() {
  if (S.calm) return;
  document.body.classList.remove("shake"); void document.body.offsetWidth; document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 460);
}
const barBottom = () => bar.getBoundingClientRect().bottom;

// ---------- the nine layers ----------
const LAYERS = [
  {
    key: "touch",
    reveal: "THE WORDS CAN CHANGE.",
    words: () => [
      W_(["CLICK", "POKE", "TAP"], { id: "v" }),
      W_(["SEVEN", "EIGHT", "ELEVEN", "TWENTY", "ONE", "THREE", "FIVE"], { id: "n" }),
      W_(["RED", "BLUE", "GREEN", "YELLOW", "PINK"], { id: "c" }),
      W_(["SQUARES", "CIRCLES", "TRIANGLES", "EYES", "STARS"], { id: "s" }),
    ],
    hints: ["the instructions are not carved in stone.", "have you tried touching the sentence?", "tap a word of the big sentence. it changes. pick something easier."],
    floatWords: ["RED", "SQUARE", "SEVEN", "CLICK", "CLICK FASTER", "NOT THAT ONE", "RED?", "■", "SEVEN!"],
    setup(L) {
      L.hits = {};
      for (const c of COLOR_KEYS) {
        for (const s of Object.values(SHAPE_OF)) {
          if (c === "RED" && s === "square") continue;
          const n = c === "BLUE" && s === "circle" ? 7 : Math.floor(rand(0, 3));
          for (let i = 0; i < n; i++) objs.push(mk(s, c));
        }
      }
      for (let i = 0; i < 2; i++) objs.push(mk("square", "RED", { flee: 210, base: 320, r: 14, red: true }));
    },
    update(L) {
      const k = get(L, "c") + SHAPE_OF[get(L, "s")], need = NUMVAL[get(L, "n")];
      L.p = need === 0 ? 1 : (L.hits[k] || 0) / need;
    },
    onTap(L, x, y) {
      const o = hitObj(x, y);
      if (!o) return;
      const c = get(L, "c"), s = SHAPE_OF[get(L, "s")];
      if (o.color === c && o.shape === s) {
        const k = c + s;
        L.hits[k] = (L.hits[k] || 0) + 1;
        popObj(o); Snd.good();
        popText(S.px, S.py, String(L.hits[k]), COLORS[c]);
        objs.push(mk(o.shape, o.color, { flee: o.flee, base: o.base, r: o.r, alpha: 0 }));
      } else {
        o.spin = 22; Snd.bad(); shake();
        popText(S.px, S.py, pick(["NO", "WRONG", "NOT THAT", "?", "NOPE"]), "#ff6b7d");
      }
    },
  },
  {
    key: "still",
    reveal: "DOING NOTHING IS ALSO DOING.",
    words: () => [
      W_(["DO"], { id: "d" }),
      W_(["NOT", "NOW", "KNOT", "NOTE"], { id: "n" }),
      W_(["TOUCH"], { id: "t" }),
      W_(["ANYTHING", "EVERYTHING"], { id: "a" }),
    ],
    hints: ["the hardest thing is nothing.", "it says what it says. even when everything screams otherwise.", "don't click or press anything for a few seconds. moving is fine."],
    floatWords: ["CLICK ME", "CONTINUE", "TOUCH", "PLEASE", "JUST ONCE", "ARE YOU THERE?", "HELLO?", "OK", "PRESS"],
    fakeRate: 0.5,
    setup(L) {
      L.start = now(); L.touch = 0; L.dlgCool = 3;
      objs.push(mk("orb", "PINK", { r: 70, base: 30, x: W / 2, y: H * 0.62 }));
      scatter(14);
    },
    update(L, dt) {
      const n = get(L, "n");
      const idle = now() - Math.max(S.lastInput, L.start);
      if (n === "NOT") {
        L.p = idle / 7;
        L.dlgCool -= dt;
        if (idle > 2.4 && L.dlgCool <= 0 && !popsEl.querySelector(".dialog")) { spawnDialog(); L.dlgCool = 4.5; }
      } else if (n === "NOW") {
        L.touch = Math.max(0, L.touch - dt * 0.4);
        L.p = L.touch / 15;
      } else {
        L.p = Math.max(0, L.p - dt * 0.5);
      }
      const orb = objs.find((o) => o.shape === "orb");
      if (orb) orb.r = 70 + Math.min(idle, 7) * 9;
    },
    onInput(L) {
      const n = get(L, "n");
      if (n === "NOW") { L.touch += 1; Snd.good(); }
      else if (n === "NOT") {
        if (L.p > 0.05) { popText(S.px, S.py, "TOUCHED.", "#ff6b7d"); Snd.bad(); }
      }
    },
  },
  {
    key: "not",
    reveal: "NOT EVERY WORD HAS TO STAY.",
    words: () => [
      W_(["YOU", "WE", "I", "THEY"], { id: "s" }),
      W_(["CAN", "MAY", "WILL", "CAN'T"], { id: "m" }),
      W_(["NOT"], { id: "not", heavy: true, removable: true }),
      W_(["WIN", "WIN?", "WIN!", "W1N"], { id: "w" }),
    ],
    hints: ["some words are heavier than others.", "words can be moved. words can be lost.", "drag NOT out of the sentence and let it fall. (two wrongs also make a right.)"],
    floatWords: ["WIN", "WIN", "YOU LOSE", "NOT", "NOT YET", "WINNER?", "CAN NOT", "WIN ▶"],
    fakeRate: 0.3,
    setup() { scatter(22); },
    update(L, dt) {
      const words = sentence(L);
      const negs = words.filter((x) => x === "NOT" || x === "CAN'T").length;
      const ok = (words.includes("YOU") || words.includes("WE")) && negs % 2 === 0;
      L.p = ok ? L.p + dt / 1.2 : Math.max(0, L.p - dt);
    },
    onHeavy(L, w) {
      if (w.id === "not" && !L.toldHeavy) { L.toldHeavy = true; whisper("too heavy to change. not too heavy to move.", 5); }
    },
  },
  {
    key: "truth",
    reveal: "MAKE IT TRUE.",
    words: () => [
      W_(["THERE"], { id: "t" }),
      W_(["ARE"], { id: "a" }),
      W_(["THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "MANY", "ZERO", "ONE", "TWO"], { id: "n" }),
      W_(["EYES", "STARS", "TRIANGLES", "MOUTHS"], { id: "k" }),
    ],
    hints: ["sentences can lie. this one does.", "is it true? then make it true.", "count the eyes and set the number. (or find a truth that's easier to count.)"],
    floatWords: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "COUNT", "RECOUNT", "TRUE", "FALSE", "LIAR", "TRUE?"],
    setup(L) {
      for (let i = 0; i < SEED.eyes; i++) objs.push(mk("eye", pick(COLOR_KEYS), { r: rand(20, 30), base: rand(25, 60) }));
      for (let i = 0; i < SEED.tris; i++) objs.push(mk("tri", pick(COLOR_KEYS), { r: rand(28, 40), base: rand(20, 40) }));
      for (let i = 0; i < 30; i++) objs.push(mk("star", pick(COLOR_KEYS), { r: rand(5, 9), base: rand(70, 170), twinkle: true }));
      L.counts = { EYES: SEED.eyes, STARS: 30, TRIANGLES: SEED.tris, MOUTHS: 0 };
    },
    update(L, dt) {
      const n = get(L, "n"), c = L.counts[get(L, "k")];
      const ok = n === "MANY" ? c >= 13 : NUMVAL[n] === c;
      L.p = ok ? L.p + dt / 3 : Math.max(0, L.p - dt * 0.6);
    },
  },
  {
    key: "world",
    reveal: "SAYING IT MAKES IT SO.",
    words: () => [
      W_(["THE"], { id: "t" }),
      W_(["DOOR", "SKY", "WORLD", "CURSOR", "NOISE"], { id: "n" }),
      W_(["IS"], { id: "i" }),
      W_(["CLOSED", "OPEN", "RED", "UPSIDE DOWN", "HUGE", "GONE", "SLOW", "NORMAL"], { id: "a" }),
    ],
    hints: ["what you say here, happens.", "there is a door somewhere. it is closed because the sentence says so.", "change CLOSED to OPEN, find the little door and knock."],
    floatWords: ["OPEN", "CLOSED", "KNOCK KNOCK", "WHO'S THERE?", "DOOR", "EXIT →", "SAY IT", "SO BE IT"],
    setup(L) {
      L.state = { DOOR: "CLOSED", SKY: "NORMAL", WORLD: "NORMAL", CURSOR: "NORMAL", NOISE: "NORMAL" };
      L.door = mk("door", "door", { r: 24, x: SEED.dx * W, y: SEED.dy * H, base: 14, scale: 1, scaleT: 1 });
      objs.push(L.door);
      scatter(26);
    },
    update(L) { L.door.x = clamp(L.door.x, 40, W - 40); },
    onWord(L, w) {
      if (w.id === "n") {
        const a = L.words.find((x) => x.id === "a");
        a.i = a.opts.indexOf(L.state[wtext(w)]);
      } else if (w.id === "a") {
        const n = get(L, "n");
        L.state[n] = wtext(w);
        applyState(L, n, wtext(w));
      }
    },
    onTap(L, x, y) {
      const d = hitObj(x, y, (o) => o.shape === "door");
      if (!d) return;
      if (d.open) { L.p = 1; flash(); }
      else { d.spin = 0; d.rattle = 0.3; Snd.thud(); shake(); popText(S.px, S.py, "LOCKED.", "#ffcf4a"); }
    },
    teardown() { resetWorld(); },
  },
  {
    key: "name",
    reveal: "THE ANSWER WAS ELSEWHERE.",
    words: () => [
      W_(["THE"], { editable: true }), W_(["ANSWER"], { editable: true }), W_(["IS"], { editable: true }),
      W_(["NOT"], { editable: true }), W_(["HERE"], { editable: true }),
    ],
    hints: ["the answer is not here. so where is it?", "look above the page. or calm down.", "the word flickers in the browser tab title, and shows up behind everything when ☾ calm is on. type it."],
    floatWords: ANSWERS.filter((a) => a !== SEED.answer).concat(["HERE", "NOT HERE", "THERE", "LOOK UP", "TYPE"]),
    setup(L) { L.buf = ""; L.flashT = rand(4, 6); L.frame = 0; scatter(26); },
    update(L, dt) {
      L.flashT -= dt;
      if (L.flashT <= 0) { L.flashT = rand(5, 8); if (!S.calm) S.flashA = 0.16; }
    },
    onKey(L, e) {
      if (e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;
      L.buf = (L.buf + e.key.toUpperCase()).slice(-24);
      typedEl.textContent = L.buf.slice(-12);
      Snd.tick();
      if (L.buf.endsWith(SEED.answer)) L.p = 1;
    },
    onType(L, v) { if (v === SEED.answer) L.p = 1; },
    onWord(L, w) { if (wtext(w) === SEED.answer) L.p = 1; },
    drawTop() {
      const a = SEED.answer, size = Math.min(W / (a.length * 0.78), H * 0.3);
      ctx.save();
      ctx.font = `${Math.round(size)}px Bungee, Impact, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff"; ctx.globalAlpha = S.calm ? 0.3 : 0.04;
      ctx.fillText(a, W / 2, H * 0.6);
      if (S.flashA > 0) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ff2a5c"; ctx.fillText(a, W / 2 - 6, H * 0.6);
        ctx.fillStyle = "#2af0ff"; ctx.fillText(a, W / 2 + 6, H * 0.6);
        ctx.fillStyle = "#fff"; ctx.fillText(a, W / 2, H * 0.6);
      }
      ctx.restore();
    },
    teardown() { typedEl.textContent = ""; document.title = "MYSTERLE"; },
  },
  {
    key: "quiet",
    reveal: "LISTEN.",
    words: () => [
      W_(["FIND", "BE", "MAKE"], { id: "v" }),
      W_(["THE"], { id: "t", removable: true }),
      W_(["QUIET", "NOISE", "SILENCE", "EXIT"], { id: "o" }),
    ],
    hints: ["somewhere in all this, there is a quiet place.", "notice where things don't go. it gets calmer the closer you are.", "move slowly, follow the calm and rest there. (or just BE QUIET.)"],
    floatWords: ["SHHH", "LOUDER", "QUIET", "NOISE", "LISTEN", "CLOSER", "COLDER", "WARMER", "HOT", "COLD"],
    setup(L) {
      L.start = now(); L.energy = 0;
      L.spot = { x: SEED.qx * W, y: SEED.qy * H, r: 160 };
      scatter(42, { base: rand(90, 170), avoid: L.spot });
      for (const o of objs) o.base = rand(90, 180);
    },
    update(L, dt) {
      L.spot.x = SEED.qx * W; L.spot.y = SEED.qy * H;
      const v = get(L, "v"), o = get(L, "o"), quiet = o === "QUIET" || o === "SILENCE";
      if (v === "FIND" && quiet) {
        const d = Math.hypot(S.px - L.spot.x, S.py - L.spot.y);
        S.calmProx = Math.pow(clamp(1 - d / 560, 0, 1), 1.5);
        L.p = d < 58 ? L.p + dt / 2.5 : Math.max(0, L.p - dt / 1.5);
      } else if (v === "BE" && quiet) {
        const still = now() - Math.max(S.lastMove, S.lastInput, L.start);
        L.p = still / 6;
        S.calmProx = clamp(L.p, 0, 1) * 0.9;
      } else if (v === "MAKE" && o === "NOISE") {
        L.energy = Math.max(0, L.energy - dt * 2.5);
        L.p = L.energy / 40;
        S.calmProx = 0; S.boost = L.p;
      } else {
        S.calmProx = 0; S.boost = 0;
        L.p = Math.max(0, L.p - dt);
      }
    },
    onInput(L) { if (get(L, "v") === "MAKE" && get(L, "o") === "NOISE") { L.energy += 1; Snd.blip(); } },
    onWord(L) {
      const v = get(L, "v"), o = get(L, "o");
      if (o === "EXIT" && !L.toldExit) { L.toldExit = true; whisper("not this time.", 3); }
      if (v === "BE") L.start = now();
    },
    teardown() { S.calmProx = 0; S.boost = 0; },
  },
  {
    key: "beat",
    reveal: "TIME IS A RULE TOO.",
    words: () => [
      W_(["CLICK", "IGNORE"], { id: "v" }),
      W_(["ON", "OFF"], { id: "p" }),
      W_(["THE"], { id: "t" }),
      W_(["BEAT"], { id: "b" }),
    ],
    hints: ["there is a pulse under everything.", "the eye at the bottom beats. so does the deep sound. the rest is noise.", "tap exactly when the eye pulses, about eight times without missing."],
    floatWords: ["1", "2", "3", "4", "TICK", "TOCK", "BOOM", "NOW", "NOW!", "NOT NOW", "♩", "♪"],
    setup(L) { L.t = 0; L.t2 = 0; L.lastBeat = now(); L.hits = 0; L.quiet = 0; scatter(24); },
    update(L, dt) {
      const P = SEED.beat;
      L.t += dt; L.t2 += dt;
      if (L.t >= P) {
        L.t -= P; L.lastBeat = now();
        Snd.kick();
        meterEl.classList.remove("pulse"); void meterEl.getBoundingClientRect(); meterEl.classList.add("pulse");
        rings.push({ x: W / 2, y: H * 0.56, r: 20, v: 520, life: 0.7, max: 0.7, col: "255,255,255", w: 5 });
        if (get(L, "v") === "IGNORE") { L.quiet++; L.p = L.quiet / 8; }
      }
      if (L.t2 >= P * 0.73) { // the decoy rhythm
        L.t2 -= P * 0.73;
        Snd.tick();
        rings.push({ x: rand(W * 0.1, W * 0.9), y: rand(H * 0.3, H * 0.9), r: 8, v: 260, life: 0.5, max: 0.5, col: "255,79,216", w: 3 });
      }
      if (get(L, "v") === "CLICK") L.p = L.hits / 8;
    },
    onInput(L) {
      const P = SEED.beat;
      if (get(L, "v") === "IGNORE") { L.quiet = 0; L.p = 0; popText(S.px, S.py, "SHH.", "#c9b8ff"); return; }
      const ph = ((now() - L.lastBeat) / P) % 1;
      const err = get(L, "p") === "ON" ? Math.min(ph, 1 - ph) * P : Math.abs(ph - 0.5) * P;
      if (err < 0.12) { L.hits++; Snd.good(); popText(S.px, S.py, "♪", "#2af0ff"); }
      else { L.hits = Math.max(0, L.hits - 1); Snd.bad(); popText(S.px, S.py, pick(["LATE", "EARLY", "OFF", "NO"]), "#ff6b7d"); }
    },
    onWord(L) { L.hits = 0; L.quiet = 0; L.p = 0; },
  },
  {
    key: "final",
    reveal: "YOU UNDERSTOOD.",
    words: () => [
      W_(["THIS"], { id: "a" }), W_(["GAME", "THING", "PAGE"], { id: "g" }), W_(["IS"], { id: "i" }), W_(["ABOUT"], { id: "b" }),
      W_(["DICE", "CATS", "COLORS", "CLICKING", "NOTHING", "CHAOS", "YOU", "LIES", "WINNING", "WORDS", "UNDERSTANDING", "CHANGING THE RULES", "EVERYTHING"], { id: "x" }),
    ],
    hints: ["what have you been doing this whole time?", "you never really followed the instructions. you did something else with them.", "it's about the words. or about understanding. or about changing the rules."],
    floatWords: ["ABOUT?", "WHAT IS IT ABOUT", "DICE", "CATS", "YOU", "THIS", "IT'S ABOUT TIME", "?", "ALMOST", "THE END?"],
    taunts: {
      DICE: "wrong game.", CATS: "meow? no.", COLORS: "closer than you think. no.", CLICKING: "you clicked a lot. that's not it.",
      NOTHING: "nothing is something. still no.", CHAOS: "the chaos is just the wrapping paper.", YOU: "flattering. no.",
      LIES: "some of them, yes. but no.", WINNING: "you never won. you understood.", EVERYTHING: "too easy.",
    },
    setup() { S.boost = 0.8; scatter(34); },
    update(L, dt) {
      const x = get(L, "x"), ok = x === "WORDS" || x === "UNDERSTANDING" || x === "CHANGING THE RULES";
      L.p = ok ? L.p + dt / 2.5 : Math.max(0, L.p - dt);
      if (L.tauntT > 0) {
        L.tauntT -= dt;
        if (L.tauntT <= 0 && L.def.taunts[x]) popText(W / 2, barBottom() + 36, L.def.taunts[x], "#e3d4ff", true);
      }
    },
    onWord(L, w) { if (w.id === "x") L.tauntT = 0.9; },
    teardown() { S.boost = 0; },
  },
];

// ---------- layer 5: the sentence changes the world ----------
function applyState(L, noun, st) {
  const cls = st.toLowerCase().replace(/\s+/g, "-");
  switch (noun) {
    case "DOOR": {
      const d = L.door;
      d.open = st === "OPEN"; d.red = st === "RED"; d.flip = st === "UPSIDE DOWN";
      d.scaleT = st === "HUGE" ? 2.6 : 1; d.hidden = st === "GONE"; d.slow = st === "SLOW";
      if (d.open) { Snd.creak(); popText(S.px, S.py, "*creak*", "#fffbe0"); }
      break;
    }
    case "SKY": S.skyMode = st; break;
    case "WORLD":
      S.worldRotT = st === "UPSIDE DOWN" ? Math.PI : 0;
      S.worldScaleT = st === "HUGE" ? 1.45 : 1;
      S.worldSpeed = st === "SLOW" ? 0.12 : 1;
      S.worldHidden = st === "GONE";
      floatLayer.classList.toggle("flip", st === "UPSIDE DOWN");
      floatLayer.classList.toggle("gone", st === "GONE");
      floatLayer.classList.toggle("huge", st === "HUGE");
      veilEl.className = "veil" + (["RED", "CLOSED", "OPEN"].includes(st) ? " veil-" + cls : "");
      break;
    case "CURSOR":
      document.body.className = document.body.className.replace(/\bcur-\S+/g, "").trim();
      if (st !== "NORMAL") document.body.classList.add("cur-on", "cur-" + cls);
      S.cursorMode = st === "NORMAL" ? null : st;
      S.cx = S.px; S.cy = S.py;
      break;
    case "NOISE":
      Snd.droneLevel = ({ GONE: 0, CLOSED: 0.25, HUGE: 2.6, OPEN: 1.6 })[st] ?? 1;
      Snd.dronePitch = st === "SLOW" ? 0.5 : st === "UPSIDE DOWN" ? 1.5 : 1;
      if (st === "RED") Snd.glitch();
      break;
  }
}
function resetWorld() {
  S.skyMode = "NORMAL"; S.worldRotT = 0; S.worldScaleT = 1; S.worldSpeed = 1; S.worldHidden = false;
  floatLayer.classList.remove("flip", "gone", "huge");
  veilEl.className = "veil";
  document.body.className = document.body.className.replace(/\bcur-\S+/g, "").trim();
  S.cursorMode = null; Snd.droneLevel = 1; Snd.dronePitch = 1;
}

// ---------- flow ----------
function startGame() {
  S.running = true; S.ended = false; S.started = true;
  S.t0 = now(); S.clicks = 0; S.changes = 0; S.hints = 0;
  startLayer(0);
}
function startLayer(i) {
  const def = LAYERS[i];
  const L = { def, words: def.words(), p: 0, t: 0, lastWhisper: 0 };
  S.layer = i; S.L = L; S.hintLevel = 0;
  objs.length = 0;
  if (def.setup) def.setup(L);
  renderWords(true);
  renderPips();
  Snd.whoosh();
}
function solveLayer() {
  const L = S.L;
  if (!L) return;
  if (L.def.teardown) L.def.teardown(L);
  S.L = null;
  Snd.chord(); flash();
  bar.querySelectorAll(".word, .word-input").forEach((el) => {
    el.style.setProperty("--ex", rand(-60, 60) + "vw"); el.style.setProperty("--ey", rand(-40, 60) + "vh");
    el.style.setProperty("--er", rand(-720, 720) + "deg"); el.classList.add("boom");
  });
  for (const o of objs.slice()) popObj(o);
  objs.length = 0;
  setTimeout(() => { if (!S.L) bar.innerHTML = ""; }, 900);
  revealEl.innerHTML = `<small>LAYER ${S.layer + 1} / ${LAYERS.length}</small><span></span>`;
  revealEl.querySelector("span").textContent = L.def.reveal;
  revealEl.classList.add("on");
  whisperEl.classList.remove("on");
  renderPips(S.layer + 1);
  const last = S.layer + 1 >= LAYERS.length;
  setTimeout(() => {
    revealEl.classList.remove("on");
    if (last) endGame(); else startLayer(S.layer + 1);
  }, last ? 3200 : 2700);
}
function renderPips(done = S.layer) {
  pipsEl.innerHTML = LAYERS.map((_, i) => `<i class="${i < done ? "done" : i === done && S.running ? "cur" : ""}"></i>`).join("");
}

function rankFor(sec, hints) {
  const t = sec + hints * 45;
  if (t < 240) return ["CLAIRVOYANT", "you saw through it before it began."];
  if (t < 480) return ["SEER", "the chaos never really fooled you."];
  if (t < 900) return ["DETECTIVE", "confused, then not."];
  if (t < 1800) return ["WANDERER", "you got lost and found the way out."];
  return ["SLEEPWALKER", "you understood. eventually."];
}
function endGame() {
  S.running = false; S.ended = true; S.endTime = now() - S.t0;
  S.calmProx = 0.85;
  renderPips(LAYERS.length);
  const sec = S.endTime, [rank, verdict] = rankFor(sec, S.hints);
  const bestKey = "mysterle-best-" + NUM, best = store.get(bestKey, null);
  const isBest = best == null || sec < best;
  if (isBest) store.set(bestKey, Math.floor(sec));
  store.set("mysterle-solved", Math.max(store.get("mysterle-solved", 0), NUM));
  $("end-num").textContent = "#" + NUM;
  $("end-rank").textContent = rank;
  $("end-verdict").textContent = verdict;
  $("end-time").textContent = fmt(sec);
  $("end-clicks").textContent = S.clicks;
  $("end-changes").textContent = S.changes;
  $("end-hints").textContent = S.hints;
  $("end-best").textContent = isBest ? "★ your best for this mystery ★" : "your best: " + fmt(best);
  const tomorrow = new Date(); tomorrow.setHours(24, 0, 0, 0);
  const mins = Math.round((tomorrow - new Date()) / 60000);
  $("end-next").textContent = `the next mystery appears in ${Math.floor(mins / 60)}h ${mins % 60}m`;
  $("end").hidden = false;
  const share = [
    `MYSTERLE #${NUM}`,
    `${rank} ⏱ ${fmt(sec)}`,
    "◆".repeat(LAYERS.length) + " " + (S.hints ? "💡".repeat(Math.min(S.hints, 9)) : "no hints"),
    `🔀 ${S.changes} words changed`,
    location.href.split("#")[0],
  ].join("\n");
  $("share-btn").onclick = () => copyText(share, $("share-btn"));
}
function copyText(text, btn) {
  const done = () => { btn.textContent = "COPIED"; setTimeout(() => (btn.textContent = "SHARE"), 1600); };
  if (navigator.share && matchMedia("(hover: none)").matches) { navigator.share({ text }).catch(() => {}); return; }
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done)); }
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
  if (!L) return;
  const th = [30, 70, 125];
  if (S.hintLevel < 3 && L.t > th[S.hintLevel]) {
    S.hintLevel++;
    whisper(L.def.hints[S.hintLevel - 1]); L.lastWhisper = L.t;
  } else if (S.hintLevel > 0 && L.t - L.lastWhisper > 38) {
    whisper(L.def.hints[S.hintLevel - 1]); L.lastWhisper = L.t;
  }
}
$("hint-btn").addEventListener("click", (e) => {
  e.currentTarget.blur();
  const L = S.L;
  if (!L) { whisper(S.ended ? "there is nothing left to hint at." : "not now."); return; }
  if (S.hintLevel < 3) { S.hintLevel++; S.hints++; }
  whisper(L.def.hints[S.hintLevel - 1]);
  L.lastWhisper = L.t;
});

// ---------- the chaos ----------
let floatT = 0, evT = 4, titleT = 3, titleGlitched = false, cdBusy = false, lastInvert = 0;
function div(cls) { const d = document.createElement("div"); d.className = cls; return d; }
function spawnFloater(kind, x, y) {
  const L = S.L, fw = L && L.def.floatWords;
  if (!kind) {
    const r = Math.random();
    kind = r < 0.16 ? "btn" : r < 0.46 ? "glyph" : r < 0.53 ? "bar" : r < 0.57 ? "win" : "text";
    if (L && L.def.fakeRate && Math.random() < L.def.fakeRate) kind = "btn";
  }
  let el;
  if (kind === "btn") {
    el = document.createElement("button"); el.type = "button"; el.className = "fl fake";
    el.textContent = fw && Math.random() < 0.5 ? pick(fw) : pick(FAKE_BTNS);
  } else if (kind === "glyph") {
    el = div("fl glyph");
    el.textContent = Array.from({ length: randInt(1, 4) }, () => pick(GLYPHS)).join("");
    el.style.fontSize = rand(20, 100) + "px";
  } else if (kind === "bar") {
    el = div("fl fbar"); el.innerHTML = "<i></i><span></span>"; el.querySelector("span").textContent = pick(BAR_LABELS);
  } else if (kind === "win") {
    el = div("fl fwin");
    el.innerHTML = "<b></b><p></p><button class='fake' type='button'>OK</button>";
    el.querySelector("b").textContent = pick(WIN_TITLES); el.querySelector("p").textContent = pick(WIN_TEXT);
  } else {
    el = div("fl ftext" + (Math.random() < 0.4 ? " mono" : ""));
    el.textContent = fw && Math.random() < 0.4 ? pick(fw) : pick(PHRASES);
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
  el.style.setProperty("--dy", rand(-spread, spread) + "vh");
  el.style.setProperty("--rot", (still ? rand(-20, 20) : rand(-360, 360)) + "deg");
  el.style.setProperty("--s1", rand(0.5, still ? 1.2 : 3).toFixed(2));
  if (!still || kind === "btn") el.style.color = `hsl(${randInt(0, 360)},100%,${randInt(60, 82)}%)`;
  if (kind === "btn") el.style.color = "#fff";
  el.style.animation = `${anim} ${dur.toFixed(2)}s ${pick(["linear", "ease-in", "ease-out", "cubic-bezier(.7,-0.5,.3,1.5)"])} forwards`;
  floatLayer.appendChild(el);
  setTimeout(() => el.remove(), dur * 1000 + 120);
}
function spawnDialog() {
  const d = div("fwin dialog");
  d.innerHTML = "<b>Mysterle.exe</b><p>ARE YOU STILL THERE?</p><button class='fake' type='button'>YES</button><button class='fake' type='button'>YES</button>";
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
  const win = btn.closest(".fwin");
  if (win) setTimeout(() => win.remove(), 250);
}
function countdownEvent() {
  if (cdBusy) return;
  cdBusy = true;
  let n = 5;
  const lines = pick([["SELF-DESTRUCT IN", "...JUST KIDDING"], ["REALITY RESETS IN", "RESET COMPLETE. NOTHING CHANGED."],
    ["THE RULES CHANGE IN", "THE RULES HAVE CHANGED."], ["UNDERSTANDING IN", "NOT YET."], ["HINT IN", "THAT WAS THE HINT."]]);
  const tick = () => {
    if (n > 0) { countdownEl.textContent = lines[0] + " " + n; countdownEl.classList.add("on"); Snd.tick(); n--; setTimeout(tick, 700); }
    else { countdownEl.textContent = lines[1]; Snd.glitch(); setTimeout(() => { countdownEl.classList.remove("on"); cdBusy = false; }, 1500); }
  };
  tick();
}
const EVENTS = [
  { calm: false, run() { shake(); Snd.glitch(); } },
  { calm: false, run() {
    if (now() - lastInvert < 4) return;
    lastInvert = now();
    document.documentElement.classList.add("invert"); Snd.glitch();
    setTimeout(() => document.documentElement.classList.remove("invert"), 120);
  } },
  { calm: true, run() { bar.style.setProperty("--tilt", rand(-9, 9).toFixed(1) + "deg"); setTimeout(() => bar.style.setProperty("--tilt", "0deg"), 2600); } },
  { calm: true, run() { for (let i = 0; i < (S.calm ? 4 : 16); i++) spawnFloater(Math.random() < 0.7 ? "glyph" : "text"); } },
  { calm: true, run: countdownEvent },
  { calm: true, run() { bigEyeEl.classList.add("on"); setTimeout(() => bigEyeEl.classList.remove("on"), 3400); } },
  { calm: false, run() { S.hueJump = rand(90, 240); Snd.glitch(); } },
  { calm: true, run() { wordLie(false); } },
  { calm: false, run() { wordLie(true); } },
  { calm: false, run() { bar.classList.add("split"); Snd.glitch(); setTimeout(() => bar.classList.remove("split"), 650); } },
  { calm: true, run() { spawnFloater("win"); } },
  { calm: true, run() { document.querySelectorAll(".ticker").forEach((t) => t.classList.toggle("rev")); } },
];
function updateChaos(dt) {
  floatT -= dt;
  if (floatT <= 0) {
    const base = S.ended ? 2.5 : S.calm ? 1.4 : 0.22;
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
}
function updateTitle(dt) {
  titleT -= dt;
  if (titleT > 0) return;
  const L = S.L;
  if (L && L.def.key === "name") {
    L.frame++;
    const f = L.frame % 8;
    document.title = f === 5 || f === 6 ? "the answer is " + SEED.answer.toLowerCase() : TITLE_GLITCH[f % TITLE_GLITCH.length];
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
  let h = sky === "RED" ? 352 : S.hue, light = sky === "OPEN" ? 2.6 : sky === "CLOSED" ? 0.35 : 1;
  const cy = sky === "UPSIDE DOWN" ? H * 0.9 : H * 0.45;
  if (sky === "GONE") { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); }
  else {
    const g = ctx.createRadialGradient(W / 2, cy, 0, W / 2, cy, Math.max(W, H) * 0.85);
    g.addColorStop(0, `hsl(${h},${sky === "RED" ? 90 : 70}%,${Math.min(60, 14 * light)}%)`);
    g.addColorStop(0.6, `hsl(${(h + (sky === "RED" ? 8 : 70)) % 360},75%,${6 * light}%)`);
    g.addColorStop(1, `hsl(${(h + (sky === "RED" ? 16 : 140)) % 360},80%,${3 * light}%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (S.worldHidden || sky === "GONE") return;
  // rotating sigils
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
  // swirling particles
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const Rs = Math.max(W, H) * 0.62 * skyScale;
  for (const p of swirl) {
    p.a += p.w * dt * sp;
    const x = W / 2 + Math.cos(p.a) * p.R * Rs, y = H / 2 + Math.sin(p.a) * p.R * Rs * 0.7;
    ctx.fillStyle = `hsla(${(h + p.h) % 360},100%,70%,${p.al * S.noise})`;
    const s = p.s * (sky === "HUGE" ? 2.5 : 1);
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}
function draw(dt) {
  drawBg(dt);
  const L = S.L;
  // world space
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate(S.worldRot); ctx.scale(S.worldScale, S.worldScale); ctx.translate(-W / 2, -H / 2);
  if (!S.worldHidden) for (const o of objs) drawObj(o);
  ctx.globalCompositeOperation = "lighter";
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
    ctx.globalAlpha = p.life / p.max; ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, p.s, p.s);
  }
  ctx.restore();
  // screen space
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
  ctx.restore();
  if (L && L.def.drawTop) L.def.drawTop(L);
  if (S.flashA > 0) S.flashA -= dt;
}
function updateMeter(dt) {
  const target = S.L ? clamp(S.L.p, 0, 1) : S.ended ? 1 : 0;
  if (target < S.lastP - 0.04 && S.L) { meterEl.classList.add("drop"); setTimeout(() => meterEl.classList.remove("drop"), 300); }
  S.lastP = target;
  S.mp += (target - S.mp) * Math.min(1, dt * 6);
  ringEl.style.strokeDashoffset = (RING_C * (1 - S.mp)).toFixed(1);
  const r = meterEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const a = Math.atan2(S.py - cy, S.px - cx), d = Math.min(9, Math.hypot(S.px - cx, S.py - cy) / 30);
  irisEl.setAttribute("transform", `translate(${(Math.cos(a) * d).toFixed(1)},${(Math.sin(a) * d * 0.6).toFixed(1)})`);
  pupilEl.setAttribute("r", (6 + 8 * S.mp).toFixed(1));
  meterEl.classList.toggle("full", S.mp > 0.97);
  if (Math.random() < dt * 0.25) { meterEl.classList.remove("blink"); void meterEl.getBoundingClientRect(); meterEl.classList.add("blink"); }
  if (bigEyeEl.classList.contains("on")) {
    const bx = (S.px / W - 0.5) * 50, by = (S.py / H - 0.5) * 30;
    bigIrisEl.setAttribute("transform", `translate(${bx.toFixed(1)},${by.toFixed(1)})`);
  }
}

// ---------- main loop ----------
let lastFrame = performance.now(), lastNoise = -1;
function frame(ts) {
  const dt = Math.min(0.05, Math.max(0, (ts - lastFrame) / 1000));
  lastFrame = ts;
  S.worldRot += (S.worldRotT - S.worldRot) * Math.min(1, dt * 2.5);
  S.worldScale += (S.worldScaleT - S.worldScale) * Math.min(1, dt * 3);
  S.speed = (S.calm ? 0.45 : 1) * (1 - 0.9 * S.calmProx) * (1 + S.boost);
  S.noise = 1 - 0.9 * S.calmProx;
  if (Math.abs(S.noise - lastNoise) > 0.01) { document.body.style.setProperty("--noise", S.noise.toFixed(2)); lastNoise = S.noise; }

  const L = S.L;
  if (L) {
    L.t += dt;
    if (L.def.update) L.def.update(L, dt);
    L.p = clamp(L.p, 0, 1);
    if (L.p >= 1 && !L.solving) { L.solving = true; solveLayer(); }
  }
  for (const o of objs) moveObj(o, dt);
  if (S.running) timerEl.textContent = fmt(now() - S.t0);
  else if (S.ended) timerEl.textContent = fmt(S.endTime);

  if (S.cursorMode) {
    const k = S.cursorMode === "SLOW" ? Math.min(1, dt * 1.8) : 1;
    S.cx += (S.px - S.cx) * k; S.cy += (S.py - S.cy) * k;
    const rot = S.cursorMode === "UPSIDE DOWN" ? " rotate(180deg)" : "";
    cursorEl.style.transform = `translate(${S.cx}px,${S.cy}px)${rot}`;
  }

  updateChaos(dt);
  updateTitle(dt);
  updateHints();
  draw(dt);
  updateMeter(dt);
  Snd.update(S.mp);
  requestAnimationFrame(frame);
}

// ---------- input ----------
window.addEventListener("pointermove", (e) => {
  if (Math.hypot(e.clientX - S.px, e.clientY - S.py) > 1.5) S.lastMove = now();
  S.px = e.clientX; S.py = e.clientY; S.pointerType = e.pointerType;
  trail.push({ x: e.clientX, y: e.clientY, t: performance.now() / 1000 });
  if (trail.length > 24) trail.shift();
}, { passive: true });
window.addEventListener("pointerdown", (e) => {
  S.px = e.clientX; S.py = e.clientY; S.pointerType = e.pointerType;
  if (!S.running) return;
  const t = e.target;
  if (t.closest && t.closest(".word, .word-input, .tool, .overlay-ui")) return;
  S.clicks++;
  S.lastInput = now();
  rings.push({ x: e.clientX, y: e.clientY, r: 4, v: 300, life: 0.5, max: 0.5, col: "255,226,58", w: 2 });
  Snd.blip();
  if (t.classList && t.classList.contains("fake")) fakeReact(t);
  const L = S.L;
  if (!L) return;
  if (L.def.onInput) L.def.onInput(L, "tap");
  if (S.L === L && L.def.onTap) { const p = toWorld(e.clientX, e.clientY); L.def.onTap(L, p.x, p.y); }
});
window.addEventListener("keydown", (e) => {
  if (!S.running || e.repeat) return;
  if (e.target && e.target.tagName === "INPUT") return;
  if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (e.target && e.target.classList && e.target.classList.contains("word") && (e.key === "Enter" || e.key === " ")) return;
  S.clicks++;
  S.lastInput = now();
  const L = S.L;
  if (!L) return;
  if (L.def.onInput) L.def.onInput(L, "key");
  if (S.L === L && L.def.onKey) L.def.onKey(L, e);
});
// a reload mid-game loses the run, so ask first
window.addEventListener("beforeunload", (e) => { if (S.running) { e.preventDefault(); e.returnValue = ""; } });

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
calmBtn.addEventListener("click", (e) => {
  e.currentTarget.blur();
  S.calm = !S.calm; applyCalm();
  whisper(S.calm ? "calm." : "chaos.", 1.5);
});
muteBtn.addEventListener("click", (e) => { e.currentTarget.blur(); S.muted = !S.muted; Snd.init(); applyMute(); });
$("splash-calm").addEventListener("change", (e) => { S.calm = e.target.checked; applyCalm(); });

// ---------- splash & end ----------
$("num").textContent = "#" + NUM;
$("splash-num").textContent = "MYSTERY #" + NUM;
{
  const best = store.get("mysterle-best-" + NUM, null);
  if (best != null) $("splash-best").textContent = "solved today in " + fmt(best) + ". again?";
}
$("tick-a").textContent = TICKER_A.repeat(3);
$("tick-b").textContent = TICKER_B.repeat(6);
$("enter").addEventListener("click", () => {
  Snd.init();
  $("splash").classList.add("gone");
  setTimeout(() => { $("splash").hidden = true; }, 800);
  startGame();
});
$("again-btn").addEventListener("click", () => {
  $("end").hidden = true;
  S.calmProx = 0;
  startGame();
});

applyCalm();
applyMute();
renderPips();
requestAnimationFrame(frame);
