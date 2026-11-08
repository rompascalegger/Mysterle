"use strict";
// Layers, tier 1: the first surprises. Every layer gets its own seeded rng (L.rng, L.pick,
// L.int, L.chance, L.shuffle), so numbers, words and colors change from day to day.
// cheat(L, T) plays the layer the intended way; the test harness uses it to prove every
// layer can be solved.

const INK = { RED: "#ff2a3d", BLUE: "#2f7bff", GREEN: "#2bff88", YELLOW: "#ffe23a", PINK: "#ff4fd8", ORANGE: "#ff8a1f", WHITE: "#ffffff", PURPLE: "#9b5cff" };
const SHAPE_NAMES = Object.keys(SHAPE_OF);
const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const numRange = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => numWord(a + i));
// rotate a list so it starts somewhere other than `avoid`
function startAway(opts, avoid, L) {
  let k = L.int(0, opts.length - 1);
  if (opts[k] === avoid) k = (k + 1) % opts.length;
  return opts.slice(k).concat(opts.slice(0, k));
}

def({
  id: "click7", tier: 1, fam: "target",
  reveal: "THE WORDS CAN CHANGE.",
  hints: ["the instructions are not carved in stone.", "have you tried touching the sentence?", "tap a word of the big sentence. it changes. pick something easier."],
  floatWords: (L) => [L.tc, L.ts, L.nums[0], "CLICK", "CLICK FASTER", "NOT THAT ONE", L.tc + "?", "■"],
  prep(L) {
    L.tc = L.pick(COLOR_KEYS); L.ts = L.pick(SHAPE_NAMES.filter((s) => s !== "EYES"));
    L.cols = [L.tc, ...L.shuffle(COLOR_KEYS.filter((c) => c !== L.tc))];
    L.shapes = [L.ts, ...L.shuffle(SHAPE_NAMES.filter((s) => s !== L.ts))];
    const big = L.int(7, 12);
    L.nums = [numWord(big), numWord(big + L.int(1, 5)), numWord(L.int(20, 40)), "ONE", numWord(L.int(2, 4))];
    L.easy = { c: L.pick(COLOR_KEYS.filter((c) => c !== L.tc)), s: L.pick(SHAPE_NAMES.filter((s) => s !== L.ts)) };
  },
  words: (L) => [W_(["CLICK", "POKE", "TAP"], { id: "v" }), W_(L.nums, { id: "n" }), W_(L.cols, { id: "c" }), W_(L.shapes, { id: "s" })],
  setup(L) {
    L.hits = {};
    for (const c of COLOR_KEYS) for (const s of SHAPE_NAMES) {
      if (c === L.tc && s === L.ts) continue;
      const n = c === L.easy.c && s === L.easy.s ? 7 : L.int(0, 2);
      for (let i = 0; i < n; i++) objs.push(mk(SHAPE_OF[s], c));
    }
    for (let i = 0; i < 2; i++) objs.push(mk(SHAPE_OF[L.ts], L.tc, { flee: 210, base: 320, r: 14 }));
  },
  update(L) {
    const k = get(L, "c") + get(L, "s"), need = NUMVAL[get(L, "n")];
    L.p = need === 0 ? 1 : (L.hits[k] || 0) / need;
  },
  onTap(L, x, y) {
    const c = get(L, "c"), s = SHAPE_OF[get(L, "s")];
    const o = hitObj(x, y, (q) => q.color === c && q.shape === s) || hitObj(x, y);
    if (!o) return;
    if (o.color === c && o.shape === s) {
      const k = c + get(L, "s");
      L.hits[k] = (L.hits[k] || 0) + 1;
      popObj(o); Snd.good();
      popText(S.px, S.py, String(L.hits[k]), COLORS[c]);
      objs.push(mk(o.shape, o.color, { flee: o.flee, base: o.base, r: o.r, alpha: 0 }));
    } else {
      o.spin = 22; Snd.bad(); shake();
      popText(S.px, S.py, pick(["NO", "WRONG", "NOT THAT", "?", "NOPE"]), "#ff6b7d");
    }
  },
  async cheat(L, T) {
    T.cycleTo("n", "ONE"); T.cycleTo("c", L.easy.c); T.cycleTo("s", L.easy.s);
    T.tapWorld(objs.find((o) => o.color === L.easy.c && o.shape === SHAPE_OF[L.easy.s]));
  },
});

def({
  id: "still", tier: 1, fam: "still",
  reveal: "DOING NOTHING IS ALSO DOING.",
  hints: ["the hardest thing is nothing.", "it says what it says. even when everything screams otherwise.", "don't click or press anything for a few seconds. moving is fine."],
  floatWords: ["CLICK ME", "CONTINUE", "TOUCH", "PLEASE", "JUST ONCE", "ARE YOU THERE?", "HELLO?", "OK", "PRESS"],
  fakeRate: 0.5,
  prep(L) { L.need = L.int(6, 9); },
  words: () => [W_("DO", { id: "d" }), W_(["NOT", "NOW", "KNOT", "NOTE"], { id: "n" }), W_("TOUCH"), W_(["ANYTHING", "EVERYTHING"])],
  setup(L) {
    L.start = now(); L.touch = 0; L.dlgCool = 3;
    L.orb = mk("orb", "PINK", { r: 70, base: 30, x: W / 2, y: H * 0.62, draw(o) {
      const r = o.r * (1 + Math.sin(S.clock * 5) * 0.08), g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, "#fff"); g.addColorStop(0.4, "#ff4fd8"); g.addColorStop(1, "rgba(255,79,216,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
      drawText("CLICK ME", r * 0.3, "#000");
    } });
    objs.push(L.orb);
    scatter(14);
  },
  update(L, dt) {
    const n = get(L, "n"), idle = now() - Math.max(S.lastInput, L.start);
    if (n === "NOT") {
      L.p = idle / L.need;
      L.dlgCool -= dt;
      if (idle > 2.4 && L.dlgCool <= 0 && !popsEl.querySelector(".dialog")) { spawnDialog(); L.dlgCool = 4.5; }
    } else if (n === "NOW") { L.touch = Math.max(0, L.touch - dt * 0.4); L.p = L.touch / 15; }
    else L.p = Math.max(0, L.p - dt * 0.5);
    L.orb.r = 70 + Math.min(idle, 7) * 9;
  },
  onInput(L) {
    const n = get(L, "n");
    if (n === "NOW") { L.touch += 1; Snd.good(); }
    else if (n === "NOT" && L.p > 0.05) { popText(S.px, S.py, "TOUCHED.", "#ff6b7d"); Snd.bad(); }
  },
  async cheat(L, T) { await T.step(L.need + 1); },
});

def({
  id: "notwin", tier: 1, fam: "negation",
  reveal: "NOT EVERY WORD HAS TO STAY.",
  hints: ["some words are heavier than others.", "words can be moved. words can be lost.", "drag NOT out of the sentence and let it fall. (two wrongs also make a right.)"],
  floatWords: ["WIN", "WIN", "YOU LOSE", "NOT", "NOT YET", "WINNER?", "CAN NOT", "WIN ▶"],
  fakeRate: 0.3,
  words: () => [
    W_(["YOU", "WE", "I", "THEY"], { id: "s" }), W_(["CAN", "MAY", "WILL", "CAN'T"], { id: "m" }),
    W_("NOT", { id: "not", heavy: true, removable: true }), W_(["WIN", "WIN?", "WIN!", "W1N"], { id: "w" }),
  ],
  setup() { scatter(22); },
  update(L, dt) {
    const w = sentence(L), negs = w.filter((x) => x === "NOT" || x === "CAN'T").length;
    fillIf(L, (w.includes("YOU") || w.includes("WE")) && negs % 2 === 0, dt, 1.2, 1);
  },
  onHeavy(L, w) { if (w.id === "not" && !L.told) { L.told = true; whisper("too heavy to change. not too heavy to move.", 5); } },
  async cheat(L, T) { T.remove("not"); },
});

def({
  id: "eyes", tier: 1, fam: "truth",
  reveal: "MAKE IT TRUE.",
  hints: ["sentences can lie. this one does.", "is it true? then make it true.", "count the eyes and set the number. (or find a truth that's easier to count.)"],
  floatWords: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "COUNT", "RECOUNT", "TRUE", "FALSE", "LIAR", "TRUE?"],
  prep(L) { L.counts = { EYES: L.int(5, 9), STARS: 30, TRIANGLES: L.pick([2, 4]), MOUTHS: 0 }; },
  words: () => [W_("THERE"), W_("ARE"),
    W_(["THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "MANY", "ZERO", "ONE", "TWO"], { id: "n" }),
    W_(["EYES", "STARS", "TRIANGLES", "MOUTHS"], { id: "k" })],
  setup(L) {
    for (let i = 0; i < L.counts.EYES; i++) objs.push(mk("eye", pick(COLOR_KEYS), { r: rand(20, 30), base: rand(25, 60) }));
    for (let i = 0; i < L.counts.TRIANGLES; i++) objs.push(mk("tri", pick(COLOR_KEYS), { r: rand(28, 40), base: rand(20, 40) }));
    for (let i = 0; i < 30; i++) objs.push(mk("star", pick(COLOR_KEYS), { r: rand(5, 9), base: rand(70, 170), twinkle: true }));
  },
  update(L, dt) {
    const n = get(L, "n"), c = L.counts[get(L, "k")];
    fillIf(L, n === "MANY" ? c >= 13 : NUMVAL[n] === c, dt, 3, 0.6);
  },
  async cheat(L, T) { T.cycleTo("n", numWord(L.counts.EYES)); },
});

function applyDoorState(L, noun, st) {
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
      break;
  }
}
function makeDoor(x, y, extra = {}) {
  return mk("door", "door", Object.assign({ r: 24, hw: 24, hh: 41, x, y, base: 14, scale: 1, scaleT: 1,
    draw(o) { ctx.rotate(Math.sin(S.clock * 1.3) * 0.05 + (o.flip ? Math.PI : 0)); drawDoorShape(o, o.open, o.red); },
    update(o, dt) { o.scale += (o.scaleT - o.scale) * Math.min(1, dt * 4); },
  }, extra));
}
def({
  id: "door", tier: 1, fam: "world",
  reveal: "SAYING IT MAKES IT SO.",
  hints: ["what you say here, happens.", "there is a door somewhere. it is closed because the sentence says so.", "change CLOSED to OPEN, find the little door and knock."],
  floatWords: ["OPEN", "CLOSED", "KNOCK KNOCK", "WHO'S THERE?", "DOOR", "EXIT →", "SAY IT", "SO BE IT"],
  words: () => [W_("THE"), W_(["DOOR", "SKY", "WORLD", "CURSOR", "NOISE"], { id: "n" }), W_("IS"),
    W_(["CLOSED", "OPEN", "RED", "UPSIDE DOWN", "HUGE", "GONE", "SLOW", "NORMAL"], { id: "a" })],
  setup(L) {
    L.state = { DOOR: "CLOSED", SKY: "NORMAL", WORLD: "NORMAL", CURSOR: "NORMAL", NOISE: "NORMAL" };
    L.door = makeDoor(W * (0.14 + 0.72 * L.rng()), H * (0.48 + 0.34 * L.rng()));
    objs.push(L.door);
    scatter(26);
  },
  onWord(L, w) {
    if (w.id === "n") { const a = wordById(L, "a"); a.i = a.opts.indexOf(L.state[wtext(w)]); }
    else if (w.id === "a") { const n = get(L, "n"); L.state[n] = wtext(w); applyDoorState(L, n, wtext(w)); }
  },
  onTap(L, x, y) {
    const d = hitObj(x, y, (o) => o === L.door);
    if (!d) return;
    if (d.open) { L.p = 1; flash(); }
    else { Snd.thud(); shake(); popText(S.px, S.py, "LOCKED.", "#ffcf4a"); }
  },
  async cheat(L, T) { T.cycleTo("a", "OPEN"); T.tapWorld(L.door); },
});

def({
  id: "stroop", tier: 1, fam: "ink",
  reveal: "SOME WORDS MEAN WHAT THEY LOOK LIKE.",
  hints: ["read it. then look at it.", "the last word is a color. it is also written in a color.", "tap the last word until it is written in the color it names."],
  floatWords: () => Object.keys(INK),
  prep(L) {
    L.names = L.shuffle(Object.keys(INK));
    // exactly one option (never the first) is written in its own color: the others get a
    // shifted copy of the remaining names, so none of them matches
    const k = L.int(2, L.names.length - 1);
    const rest = L.names.filter((_, i) => i !== k), shifted = rest.slice(1).concat(rest.slice(0, 1));
    let r = 0;
    L.inks = L.names.map((n, i) => (i === k ? n : shifted[r++]));
    L.good = k;
  },
  words: (L) => [W_("THIS", { ink: INK[L.pick(Object.keys(INK))] }), W_("WORD", { ink: INK[L.pick(Object.keys(INK))] }), W_("IS"),
    W_(L.names, { id: "c", ink: INK[L.inks[0]] })],
  setup() { scatter(24); },
  onWord(L, w) { if (w.id === "c") w.ink = INK[L.inks[w.i]]; },
  update(L, dt) { const w = wordById(L, "c"); fillIf(L, L.inks[w.i] === L.names[w.i], dt, 1.5, 1); },
  async cheat(L, T) { const w = T.word("c"); for (let g = 0; g < 10 && L.inks[w.i] !== L.names[w.i]; g++) T.tapWord("c"); },
});

def({
  id: "arith", tier: 1, fam: "truth",
  reveal: "EVEN NUMBERS CAN BE CORRECTED.",
  hints: ["that's not how numbers work.", "make the sum true. any word that is a number can change.", "change the last number to what the left side really is."],
  floatWords: ["2+2=5", "MATH", "CARRY THE ONE", "≠", "=", "+", "×", "-", "WRONG"],
  prep(L) { L.a = L.int(1, 9); L.b = L.int(1, 9); L.c = L.a + L.b + L.pick([-2, -1, 1, 2, 3]); },
  words: (L) => [
    W_(startAway(numRange(0, 12), "", L).slice(), { id: "a" }), W_(["PLUS", "MINUS", "TIMES"], { id: "o" }),
    W_(numRange(0, 12), { id: "b" }), W_("IS"), W_(numRange(0, 20), { id: "c" }),
  ],
  setup(L) {
    setWordTo(wordById(L, "a"), numWord(L.a)); setWordTo(wordById(L, "b"), numWord(L.b)); setWordTo(wordById(L, "c"), numWord(Math.max(0, L.c)));
    scatter(20);
  },
  update(L, dt) {
    const a = NUMVAL[get(L, "a")], b = NUMVAL[get(L, "b")], c = NUMVAL[get(L, "c")], o = get(L, "o");
    const v = o === "PLUS" ? a + b : o === "MINUS" ? a - b : a * b;
    fillIf(L, v === c, dt, 1.5, 1);
  },
  async cheat(L, T) { T.cycleTo("c", numWord(L.a + L.b)); },
});

def({
  id: "hour", tier: 1, fam: "real",
  reveal: "THE GAME KNOWS WHAT TIME IT IS. NOW YOU DO TOO.",
  hints: ["is it, though?", "this sentence is about the real world.", "set the number to the hour on your clock right now."],
  floatWords: ["TICK", "TOCK", "LATE", "EARLY", "⌚", "WHAT TIME IS IT", "NOW", "THEN"],
  words: (L) => { const h = new Date().getHours() % 12 || 12; return [W_("IT"), W_("IS"), W_(startAway(numRange(1, 12), numWord(h), L), { id: "n" }), W_("O'CLOCK")]; },
  setup() { scatter(20); },
  update(L, dt) { const h = new Date().getHours() % 12 || 12; fillIf(L, NUMVAL[get(L, "n")] === h, dt, 1.5, 1); },
  async cheat(L, T) { T.cycleTo("n", numWord(new Date().getHours() % 12 || 12)); },
});

def({
  id: "weekday", tier: 1, fam: "real",
  reveal: "TODAY IS REAL.",
  hints: ["check your calendar.", "this one is about the world outside the screen.", "set the day to today's real weekday."],
  floatWords: DAYS.concat(["YESTERDAY", "TOMORROW", "SOMEDAY"]),
  words: (L) => [W_("TODAY"), W_("IS"), W_(startAway(DAYS, DAYS[new Date().getDay()], L), { id: "d" })],
  setup() { scatter(22); },
  update(L, dt) { fillIf(L, get(L, "d") === DAYS[new Date().getDay()], dt, 1.5, 1); },
  async cheat(L, T) { T.cycleTo("d", DAYS[new Date().getDay()]); },
});

def({
  id: "device", tier: 1, fam: "real",
  reveal: "THE GAME CAN SEE WHAT YOU'RE HOLDING.",
  hints: ["where are you, really?", "look at what you are playing this on.", "make the sentence name your device: a phone, a computer or a tablet."],
  floatWords: ["🌙", "WHERE AM I", "HERE", "THERE", "SCREEN", "GLASS"],
  words: (L) => [W_("YOU"), W_("ARE"), W_("ON"), W_(startAway(["THE MOON", "A BOAT", "A PHONE", "A COMPUTER", "A TABLET", "A TRAIN"], deviceKind(), L), { id: "d" })],
  setup() { scatter(22); },
  update(L, dt) { fillIf(L, get(L, "d") === deviceKind(), dt, 1.5, 1); },
  async cheat(L, T) { T.cycleTo("d", deviceKind()); },
});

def({
  id: "magic", tier: 1, fam: "type",
  reveal: "MANNERS ARE A KEY.",
  hints: ["what do you say when you want something?", "you can type. on a keyboard, or into the words themselves.", "type PLEASE (or tap a word and write it)."],
  floatWords: ["ABRA", "CADABRA", "SAY IT", "THE WORD", "MAGIC", "✨", "SHAZAM?"],
  words: () => ["SAY", "THE", "MAGIC", "WORD"].map((t) => W_(t, { editable: true })),
  answers: () => ["PLEASE", "PLEASE?", "ABRACADABRA", "OPEN SESAME", "XYZZY", "SIMSALABIM", "BITTE"],
  setup() { scatter(22); },
  async cheat(L, T) { T.type("please"); },
});

def({
  id: "button", tier: 1, fam: "defy",
  reveal: "RULES BEND IF YOU PUSH.",
  hints: ["it's a very tempting button.", "rules sometimes give up if you insist.", "press it anyway. more than once."],
  floatWords: ["DON'T", "PLEASE DON'T", "DO IT", "PRESS", "NO", "WHY NOT?"],
  words: () => [W_("DO", { heavy: true }), W_("NOT", { id: "not", heavy: true, removable: true }), W_("PRESS"), W_("THE"), W_("BUTTON")],
  setup(L) {
    L.presses = 0;
    L.btn = mk("button", "RED", { r: 70, x: W / 2, y: H * 0.62, fixed: true, label: "PRESS", draw: drawButton, pressT: 0,
      update(o, dt) { o.pressT = Math.max(0, o.pressT - dt); } });
    objs.push(L.btn);
    scatter(12);
  },
  onTap(L, x, y) {
    if (!hitObj(x, y, (o) => o === L.btn)) return;
    L.btn.pressT = 0.15; Snd.kick();
    if (!get(L, "not")) { L.p = 1; return; }
    L.presses++;
    const say = ["I SAID DON'T.", "LAST WARNING.", "...FINE."][Math.min(2, L.presses - 1)];
    popText(W / 2, H * 0.62 - 100, say, "#ffb3c4", true);
    if (L.presses >= 3) L.p = 1;
  },
  async cheat(L, T) { for (let i = 0; i < 3; i++) T.tapWorld(L.btn); },
});

def({
  id: "upright", tier: 1, fam: "rotate",
  reveal: "EVERY WORD HAS AN UP.",
  hints: ["tilt your head. or don't.", "the words can turn.", "tap each word until it stands upright."],
  floatWords: ["↻", "↺", "UP", "DOWN", "WHICH WAY", "⤾"],
  prep(L) { L.text = L.pick(["READ ME RIGHT", "TURN THE WORDS", "STAND UP STRAIGHT", "WHICH WAY IS UP", "THE FLOOR IS ABOVE"]).split(" "); },
  words: (L) => L.text.map((t, i) => W_(t, { id: "w" + i, rot: i === 0 ? L.pick([90, 180, 270]) : L.pick([0, 90, 180, 270]),
    onTap(_, w) { w.rot = (w.rot + 90) % 360; } })),
  setup() { scatter(22); },
  update(L, dt) { fillIf(L, L.words.every((w) => w.rot === 0), dt, 1, 1); },
  async cheat(L, T) { for (const w of L.words) while (w.rot !== 0) T.tapWord(w.id); },
});

def({
  id: "empty", tier: 1, fam: "remove",
  reveal: "SILENCE IS ALSO A SENTENCE.",
  hints: ["is it empty?", "words that won't change might still leave.", "drag every word out of the sentence."],
  floatWords: ["EMPTY", "FULL", "HALF", "NOTHING", "∅", "LEAVE"],
  prep(L) { L.text = L.pick(["THIS SENTENCE IS NOT EMPTY", "NOTHING CAN BE REMOVED", "ALL OF THESE WORDS MUST STAY"]).split(" "); },
  words: (L) => L.text.map((t, i) => W_(t, { id: "w" + i, heavy: true, removable: true })),
  setup() { scatter(22); },
  update(L, dt) { fillIf(L, L.words.length === 0, dt, 0.8, 1); },
  async cheat(L, T) { while (L.words.length) T.remove(L.words[0].id); },
});

def({
  id: "wait9999", tier: 1, fam: "time",
  reveal: "TIME IS ONLY A NUMBER IN A SENTENCE.",
  hints: ["that's a long wait.", "the waiting time is written in the sentence. so it can be rewritten.", "change the number (or the unit) to something short and wait."],
  floatWords: ["⌛", "STILL WAITING", "ALMOST", "9999", "PATIENCE", "ZZZ"],
  words: (L) => [W_("THIS"), W_("WILL"), W_("TAKE"), W_(["9999", "4200", "777", "99", "9", "ONE"], { id: "n" }), W_(["SECONDS", "HOURS", "YEARS", "MOMENTS"], { id: "u" })],
  setup(L) { L.left = 9999; scatter(18); },
  onWord(L) {
    const raw = get(L, "n"), v = /^\d+$/.test(raw) ? Number(raw) : NUMVAL[raw];
    L.left = v * ({ SECONDS: 1, HOURS: 3600, YEARS: 31536000, MOMENTS: 0.5 })[get(L, "u")];
  },
  update(L, dt) {
    if (L.t < 0.05) L.def.onWord(L);
    L.left -= dt;
    if (L.left <= 0) L.p = 1;
  },
  drawTop(L) { ctx.save(); ctx.globalAlpha = 0.85; drawText(fmt(Math.max(0, L.left)), Math.min(W / 7, 90), "#ffe23a", W / 2, H * 0.6); ctx.restore(); },
  async cheat(L, T) { T.cycleTo("n", "9"); await T.step(10); },
});

def({
  id: "lights", tier: 1, fam: "world",
  reveal: "LIGHT IS JUST A WORD AWAY.",
  hints: ["it's dark in here. something is glowing.", "the sentence says the lights are off. sentences can be changed.", "switch the lights on, then find the EXIT sign."],
  floatWords: ["💡", "CLICK", "OFF", "ON", "DARK", "WHO'S THERE"],
  words: () => [W_("THE"), W_("LIGHTS"), W_("ARE"), W_(["OFF", "ON", "FLICKERING", "DREAMING"], { id: "s" })],
  setup(L) {
    S.dark = 0.97;
    L.exit = mk("exit", "#2bff88", { r: 30, hw: 34, hh: 16, x: W * (0.15 + 0.7 * L.rng()), y: H * (0.45 + 0.4 * L.rng()), base: 10,
      draw(o) { ctx.fillStyle = "#063"; ctx.fillRect(-o.hw, -o.hh, o.hw * 2, o.hh * 2); drawText("EXIT", 18, "#7dffb3"); } });
    objs.push(L.exit);
    scatter(26);
  },
  update(L) {
    const s = get(L, "s");
    S.dark = s === "ON" ? 0 : s === "FLICKERING" ? (Math.sin(S.clock * 23) > 0.3 ? 0 : 0.95) : s === "DREAMING" ? 0.6 : 0.97;
  },
  onTap(L, x, y) { if (hitObj(x, y, (o) => o === L.exit)) { L.p = 1; flash(); } },
  teardown() { S.dark = 0; },
  async cheat(L, T) { T.cycleTo("s", "ON"); T.tapWorld(L.exit); },
});

def({
  id: "box", tier: 1, fam: "world",
  reveal: "TWO WORDS, ONE BOX.",
  hints: ["what's in the box?", "two words describe the box. both of them are wrong for you.", "make the box OPEN and FULL, then tap it."],
  floatWords: ["📦", "EMPTY", "FULL", "LOCKED", "OPEN", "WHAT'S INSIDE"],
  words: () => [W_("THE"), W_("BOX"), W_("IS"), W_(["LOCKED", "OPEN", "GONE", "SINGING"], { id: "a" }), W_("AND"), W_(["EMPTY", "FULL", "HUNGRY", "ASLEEP"], { id: "b" })],
  setup(L) {
    L.box = mk("box", "#c98a3e", { r: 40, hw: 44, hh: 36, x: W / 2, y: H * 0.64, base: 25,
      draw(o) {
        if (get(L, "a") === "GONE") return;
        const open = get(L, "a") === "OPEN";
        ctx.fillStyle = "#7a4a1a"; ctx.fillRect(-o.hw, -o.hh * 0.5, o.hw * 2, o.hh * 1.5);
        ctx.fillStyle = "#c98a3e"; ctx.save();
        if (open) { ctx.translate(-o.hw, -o.hh * 0.5); ctx.rotate(-0.9); ctx.fillRect(0, -14, o.hw * 2, 14); }
        else ctx.fillRect(-o.hw - 4, -o.hh * 0.5 - 14, o.hw * 2 + 8, 14);
        ctx.restore();
        if (get(L, "a") === "LOCKED") { ctx.fillStyle = "#ffcf4a"; ctx.fillRect(-8, -o.hh * 0.5 - 6, 16, 16); }
        if (open && get(L, "b") === "FULL") drawText("✶✶✶", 22, "#ffe23a", 0, -o.hh * 0.6);
        if (get(L, "a") === "SINGING") drawText("♪", 26, "#fff", o.hw, -o.hh);
      } });
    objs.push(L.box);
    scatter(16);
  },
  onTap(L, x, y) {
    const a = get(L, "a"), b = get(L, "b");
    if (a === "GONE" || !hitObj(x, y, (o) => o === L.box)) return;
    if (a === "OPEN" && b === "FULL") { L.p = 1; return; }
    Snd.thud(); popText(S.px, S.py, a === "OPEN" ? b + "." : a + ".", "#ffcf4a");
  },
  async cheat(L, T) { T.cycleTo("a", "OPEN"); T.cycleTo("b", "FULL"); T.tapWorld(L.box); },
});

def({
  id: "anykey", tier: 1, fam: "literal",
  reveal: "TAKE IT LITERALLY.",
  hints: ["your keyboard is the wrong keyboard.", "which key is the ANY key?", "find the key labeled ANY on the screen and tap it."],
  floatWords: ["⌨", "ANY", "KEY", "PRESS", "NOT THAT ONE", "THE ANY KEY"],
  words: () => [W_("PRESS"), W_("ANY"), W_("KEY")],
  setup(L) {
    for (const lab of L.shuffle(["ANY", "ESC", "F13", "∅", "CTRL", "?", "NOPE", "ALT+F4"])) {
      const k = mk("key", "#fff", { r: 34, hw: 36, hh: 30, label: lab, base: rand(30, 70), draw: drawKey });
      if (lab === "ANY") L.any = k;
      objs.push(k);
    }
    scatter(10);
  },
  onKey() { popText(W / 2, H * 0.55, "THERE IS NO ANY KEY ON YOUR KEYBOARD.", "#ffb3c4", true); Snd.bad(); },
  onTap(L, x, y) {
    const k = hitObj(x, y, (o) => o.shape === "key");
    if (!k) return;
    if (k === L.any) L.p = 1; else { Snd.bad(); popText(S.px, S.py, "THAT'S " + k.label + ".", "#ffb3c4"); }
  },
  async cheat(L, T) { T.tapWorld(L.any); },
});

def({
  id: "help", tier: 1, fam: "meta",
  reveal: "THE BUTTONS ARE PART OF THE GAME.",
  hints: ["nobody? really?", "you have been ignoring a button in the corner.", "make SOMEBODY help you, then press the ? button."],
  floatWords: ["HELP", "SOS", "?", "ANYBODY?", "HELLO?", "NOBODY"],
  words: () => [W_(["NOBODY", "SOMEBODY", "ANYBODY", "THE EYE"], { id: "w" }), W_("CAN"), W_("HELP"), W_("YOU")],
  setup() { scatter(22); },
  onTool(L, name) {
    if (name !== "hint") return false;
    const w = get(L, "w");
    if (w === "SOMEBODY" || w === "ANYBODY") { L.p = 1; return true; }
    whisper(w === "NOBODY" ? "nobody." : "the eye is watching. it doesn't help.", 3);
    return true;
  },
  onEye(L) { if (get(L, "w") === "THE EYE") L.p = 1; },
  async cheat(L, T) { T.cycleTo("w", "SOMEBODY"); T.tool("hint"); },
});

def({
  id: "calm", tier: 1, fam: "meta",
  reveal: "YOU CONTROL THE NOISE.",
  hints: ["too much? or not enough?", "there is a switch for this in the corner.", "follow the sentence with the ☾ button in the top right."],
  floatWords: ["BREATHE", "PANIC", "CALM", "☾", "LOUDER", "SHH"],
  words: () => [W_("YOU"), W_("NEED"), W_("TO"), W_(["CALM DOWN", "LOSE CONTROL", "SLEEP"], { id: "w" })],
  setup() { S.boost = 1; scatter(30); },
  update() { S.boost = S.calm ? 0 : 1; },
  onTool(L, name) {
    if (name !== "calm") return false;
    const w = get(L, "w");
    if ((w === "CALM DOWN" && S.calm) || (w === "LOSE CONTROL" && !S.calm)) L.p = 1;
    return false;
  },
  teardown() { S.boost = 0; },
  async cheat(L, T) { T.cycleTo("w", "CALM DOWN"); if (S.calm) T.tool("calm"); T.tool("calm"); },
});

def({
  id: "loud", tier: 1, fam: "meta",
  reveal: "SILENCE HAS A BUTTON.",
  hints: ["listen to it.", "there is a button for sound.", "too loud? press ♪. too quiet? press ♪ again."],
  floatWords: ["♪", "♫", "LOUDER", "QUIETER", "SHH", "🔊"],
  words: () => [W_("THIS"), W_("IS"), W_("TOO"), W_(["LOUD", "QUIET", "MUCH"], { id: "w" })],
  setup() { Snd.droneLevel = 2; scatter(26); },
  onTool(L, name) {
    if (name !== "mute") return false;
    const w = get(L, "w");
    if ((w === "LOUD" && S.muted) || (w === "QUIET" && !S.muted)) L.p = 1;
    return false;
  },
  async cheat(L, T) { T.cycleTo("w", "LOUD"); if (S.muted) T.tool("mute"); T.tool("mute"); },
});

def({
  id: "selfwords", tier: 1, fam: "self",
  reveal: "A SENTENCE CAN DESCRIBE ITSELF.",
  hints: ["what is this sentence talking about?", "it is talking about itself. count.", "set the number to how many words the sentence has."],
  floatWords: ["1", "2", "3", "COUNT", "WORDS", "THIS"],
  prep(L) { L.extra = L.chance(0.5); },
  words: (L) => [W_("THIS"), W_("SENTENCE", { removable: true }), W_("HAS")].concat(L.extra ? [W_("EXACTLY", { removable: true })] : [])
    .concat([W_(startAway(numRange(1, 9), numWord(L.extra ? 6 : 5), L), { id: "n" }), W_("WORDS")]),
  setup() { scatter(22); },
  update(L, dt) { fillIf(L, NUMVAL[get(L, "n")] === L.words.length, dt, 1.5, 1); },
  async cheat(L, T) { T.cycleTo("n", numWord(L.words.length)); },
});

def({
  id: "layer", tier: 1, fam: "meta",
  reveal: "YOU KNOW WHERE YOU ARE.",
  hints: ["how deep are you?", "the top left corner keeps count.", "set the number to this layer's number."],
  floatWords: ["DEEPER", "LAYER", "WHERE", "HERE", "⬇", "?"],
  prep(L) { L.here = S.idx + 1; },
  words: (L) => [W_("YOU"), W_("ARE"), W_("ON"), W_("LAYER"), W_(startAway(numRange(1, Math.max(12, Math.min(99, L.here + 3))), numWord(L.here), L), { id: "n" })],
  setup() { scatter(22); },
  update(L, dt) { fillIf(L, NUMVAL[get(L, "n")] === S.idx + 1, dt, 1.5, 1); },
  async cheat(L, T) { T.cycleTo("n", numWord(S.idx + 1)); },
});

def({
  id: "split", tier: 1, fam: "count",
  reveal: "ONE CAN BECOME MANY.",
  hints: ["one is not enough.", "tap the circle. count what you have. too many? change the goal.", "tap to split. set the number to something you can reach and keep it there."],
  floatWords: ["÷", "×2", "ONE", "TWO", "MANY", "MITOSIS"],
  words: () => [W_("MAKE"), W_(["SIXTEEN", "TWELVE", "EIGHT", "FOUR", "TWO"], { id: "n" })],
  setup(L) { objs.push(mk("circle", "GREEN", { r: 60, x: W / 2, y: H * 0.62, base: 30, born: now() })); },
  onTap(L, x, y) {
    const o = hitObj(x, y, (q) => q.shape === "circle");
    if (!o || o.r < 10) return;
    popObj(o, 6);
    for (const s of [-1, 1]) objs.push(mk("circle", pick(COLOR_KEYS), { r: o.r * 0.78, x: o.x + s * o.r * 0.4, y: o.y, vx: s * 140, vy: rand(-60, 60), base: o.base + 20, born: now() }));
    Snd.good();
  },
  update(L, dt) {
    const cs = objs.filter((o) => o.shape === "circle");
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
      const a = cs[i], b = cs[j];
      if (now() - a.born > 2.5 && now() - b.born > 2.5 && Math.hypot(a.x - b.x, a.y - b.y) < (a.r + b.r) * 0.6 && objs.includes(a) && objs.includes(b)) {
        a.r = Math.min(70, Math.hypot(a.r, b.r)); a.born = now(); popObj(b, 6); Snd.thud();
      }
    }
    fillIf(L, cs.length === NUMVAL[get(L, "n")], dt, 1.2, 1);
  },
  async cheat(L, T) { T.cycleTo("n", "TWO"); T.tapWorld(objs.find((o) => o.shape === "circle")); },
});

def({
  id: "sleep", tier: 1, fam: "eyes",
  reveal: "EVEN EYES GET TIRED.",
  hints: ["they never stop watching.", "tap an eye. watch what it does. now all of them at once.", "put every eye to sleep at the same time (or ask for just one EYE)."],
  floatWords: ["Z", "ZZZ", "WAKE UP", "👁", "SHH", "GOODNIGHT"],
  prep(L) { L.n = L.int(4, 7); },
  words: () => [W_("PUT"), W_("THE"), W_(["EYES", "EYE"], { id: "e" }), W_("TO"), W_(["SLEEP", "WORK"], { id: "s" })],
  setup(L) { for (let i = 0; i < L.n; i++) objs.push(mk("eye", pick(COLOR_KEYS), { r: rand(22, 32), base: rand(30, 70), sleepT: 0 })); scatter(8); },
  onTap(L, x, y) {
    // an awake eye wins over a sleeping one lying on top of it
    const o = hitObj(x, y, (q) => q.shape === "eye" && !q.asleep) || hitObj(x, y, (q) => q.shape === "eye");
    if (!o) return;
    if (get(L, "s") === "SLEEP") { o.asleep = true; o.sleepT = 3.5; Snd.tone(300, 0.3, "sine", 0.08, 120); }
    else { o.spin = 10; popText(S.px, S.py, "BUSY.", "#c9b8ff"); }
  },
  update(L, dt) {
    const eyes = objs.filter((o) => o.shape === "eye");
    for (const o of eyes) if (o.asleep) { o.sleepT -= dt; if (o.sleepT <= 0) o.asleep = false; }
    const sleeping = eyes.filter((o) => o.asleep).length;
    if (get(L, "e") === "EYE" ? sleeping >= 1 : sleeping === eyes.length) L.p = 1;
  },
  async cheat(L, T) {
    for (let g = 0; g < 40 && S.L === L; g++) { const o = objs.find((q) => q.shape === "eye" && !q.asleep); if (!o) break; T.tapWorld(o); }
  },
});
