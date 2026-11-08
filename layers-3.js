"use strict";
// Layers, tier 3: look elsewhere, listen, remember.

const SECRET_WORDS = ["LANTERN", "MOTH", "VELVET", "ECHO", "THIMBLE", "ORBIT", "MARROW", "QUILL", "HOLLOW", "EMBER",
  "WILLOW", "CIPHER", "TIDE", "RAVEN", "PRISM", "FABLE", "LICHEN", "OPAL", "COMET", "GLOVE", "ANCHOR", "SPOON", "TULIP", "GRAVEL"];

def({
  id: "beat", tier: 3, fam: "rhythm",
  reveal: "TIME IS A RULE TOO.",
  hints: ["there is a pulse under everything.", "the eye at the bottom beats. so does the deep sound. the rest is noise.", "tap exactly when the eye pulses, about eight times without missing."],
  floatWords: ["1", "2", "3", "4", "TICK", "TOCK", "BOOM", "NOW", "NOW!", "NOT NOW", "♩", "♪"],
  prep(L) { L.period = 0.52 + 0.14 * L.rng(); },
  words: () => [W_(["CLICK", "IGNORE"], { id: "v" }), W_(["ON", "OFF"], { id: "p" }), W_("THE"), W_("BEAT")],
  setup(L) { L.t1 = 0; L.t2 = 0; L.lastBeat = now(); L.hits = 0; L.quiet = 0; scatter(24); },
  update(L, dt) {
    const P = L.period;
    L.t1 += dt; L.t2 += dt;
    if (L.t1 >= P) {
      L.t1 -= P; L.lastBeat = now();
      Snd.kick(); pulseMeter();
      rings.push({ x: W / 2, y: H * 0.56, r: 20, v: 520, life: 0.7, max: 0.7, col: "255,255,255", w: 5 });
      if (get(L, "v") === "IGNORE") { L.quiet++; L.p = L.quiet / 8; }
    }
    if (L.t2 >= P * 0.73) {
      L.t2 -= P * 0.73; Snd.tick();
      rings.push({ x: rand(W * 0.1, W * 0.9), y: rand(H * 0.3, H * 0.9), r: 8, v: 260, life: 0.5, max: 0.5, col: "255,79,216", w: 3 });
    }
    if (get(L, "v") === "CLICK") L.p = L.hits / 8;
  },
  onInput(L) {
    const P = L.period;
    if (get(L, "v") === "IGNORE") { L.quiet = 0; L.p = 0; popText(S.px, S.py, "SHH.", "#c9b8ff"); return; }
    const ph = ((now() - L.lastBeat) / P) % 1;
    const err = get(L, "p") === "ON" ? Math.min(ph, 1 - ph) * P : Math.abs(ph - 0.5) * P;
    if (err < 0.12) { L.hits++; Snd.good(); popText(S.px, S.py, "♪", "#2af0ff"); }
    else { L.hits = Math.max(0, L.hits - 1); Snd.bad(); popText(S.px, S.py, pick(["LATE", "EARLY", "OFF", "NO"]), "#ff6b7d"); }
  },
  onWord(L) { L.hits = 0; L.quiet = 0; L.p = 0; },
  async cheat(L, T) {
    for (let i = 0; i < 10 && S.L === L; i++) { const lb = L.lastBeat; for (let g = 0; g < 60 && L.lastBeat === lb && S.L === L; g++) await T.step(1 / 30); if (S.L === L) T.tap(W * 0.3, H * 0.75); }
  },
});

def({
  id: "name", tier: 3, fam: "elsewhere",
  reveal: "THE ANSWER WAS ELSEWHERE.",
  hints: ["the answer is not here. so where is it?", "look above the page. or calm down.", "the word flickers in the browser tab title, and shows up behind everything when ☾ calm is on. type it."],
  floatWords: () => SECRET_WORDS.concat(["HERE", "NOT HERE", "THERE", "LOOK UP", "TYPE"]),
  prep(L) { L.ans = L.pick(SECRET_WORDS); },
  words: () => ["THE", "ANSWER", "IS", "NOT", "HERE"].map((t) => W_(t, { editable: true })),
  answers: (L) => [L.ans],
  title: (L, f) => (f % 8 === 5 || f % 8 === 6 ? "the answer is " + L.ans.toLowerCase() : null),
  setup(L) { L.flashT = rand(4, 6); scatter(26); },
  update(L, dt) { L.flashT -= dt; if (L.flashT <= 0) { L.flashT = rand(5, 8); if (!S.calm) S.flashA = 0.16; } },
  drawTop(L) { faintWord(L.ans); },
  teardown() { document.title = "MYSTERLE"; },
  async cheat(L, T) { T.type(L.ans.toLowerCase()); },
});
// a word drawn huge behind everything: faint normally, readable in calm mode, flashed by S.flashA
function faintWord(a, y = 0.6) {
  const size = Math.min(W / (a.length * 0.78), H * 0.3);
  ctx.save();
  ctx.font = `${Math.round(size)}px Bungee, Impact, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff"; ctx.globalAlpha = S.calm ? 0.3 : 0.04;
  ctx.fillText(a, W / 2, H * y);
  if (S.flashA > 0) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ff2a5c"; ctx.fillText(a, W / 2 - 6, H * y);
    ctx.fillStyle = "#2af0ff"; ctx.fillText(a, W / 2 + 6, H * y);
    ctx.fillStyle = "#fff"; ctx.fillText(a, W / 2, H * y);
  }
  ctx.restore();
}

def({
  id: "quiet", tier: 3, fam: "search",
  reveal: "LISTEN.",
  hints: ["somewhere in all this, there is a quiet place.", "notice where things don't go. it gets calmer the closer you are.", "move slowly, follow the calm and rest there. (or just BE QUIET.)"],
  floatWords: ["SHHH", "LOUDER", "QUIET", "NOISE", "LISTEN", "CLOSER", "COLDER", "WARMER", "HOT", "COLD"],
  prep(L) { L.fx = 0.16 + 0.68 * L.rng(); L.fy = 0.46 + 0.36 * L.rng(); },
  words: () => [W_(["FIND", "BE", "MAKE"], { id: "v" }), W_("THE", { id: "t", removable: true }), W_(["QUIET", "NOISE", "SILENCE", "EXIT"], { id: "o" })],
  setup(L) {
    L.start = now(); L.energy = 0;
    L.spot = { x: L.fx * W, y: L.fy * H, r: 160 };
    for (const o of scatter(42, { avoid: L.spot })) o.base = rand(90, 180);
  },
  update(L, dt) {
    L.spot.x = L.fx * W; L.spot.y = L.fy * H;
    const v = get(L, "v"), o = get(L, "o"), quiet = o === "QUIET" || o === "SILENCE";
    if (v === "FIND" && quiet) {
      const d = Math.hypot(S.px - L.spot.x, S.py - L.spot.y);
      S.calmProx = Math.pow(clamp(1 - d / 560, 0, 1), 1.5);
      fillIf(L, d < 58, dt, 2.5, 1 / 1.5);
    } else if (v === "BE" && quiet) {
      L.p = (now() - Math.max(S.lastMove, S.lastInput, L.start)) / 6;
      S.calmProx = clamp(L.p, 0, 1) * 0.9;
    } else if (v === "MAKE" && o === "NOISE") {
      L.energy = Math.max(0, L.energy - dt * 2.5); L.p = L.energy / 40; S.calmProx = 0; S.boost = L.p;
    } else { S.calmProx = 0; S.boost = 0; L.p = Math.max(0, L.p - dt); }
  },
  onInput(L) { if (get(L, "v") === "MAKE" && get(L, "o") === "NOISE") { L.energy += 1; Snd.blip(); } },
  onWord(L) {
    if (get(L, "o") === "EXIT" && !L.toldExit) { L.toldExit = true; whisper("not this time.", 3); }
    if (get(L, "v") === "BE") L.start = now();
  },
  async cheat(L, T) { T.move(L.spot.x + 5, L.spot.y - 5); await T.step(3); },
});

def({
  id: "goaway", tier: 3, fam: "meta",
  reveal: "THE GAME CONTINUES WHEN YOU'RE GONE.",
  hints: ["it doesn't want you here.", "do what it says. literally. then come back.", "switch to another tab or app (or click outside the window), then return."],
  floatWords: ["GO", "AWAY", "LEAVE", "BYE", "👋", "COME BACK"],
  words: () => [W_("GO"), W_(["AWAY", "HOME", "BACK"], { id: "w" })],
  setup() { scatter(22); },
  onAway(L, away, secs) { if (!away && secs >= 0.8 && get(L, "w") === "AWAY") L.p = 1; },
  onBrand(L) { if (get(L, "w") === "HOME") L.p = 1; },
  async cheat(L, T) { T.away(2); },
});

def({
  id: "titlecmd", tier: 3, fam: "elsewhere",
  reveal: "INSTRUCTIONS CAN HIDE IN THE CHROME.",
  hints: ["why would it say that?", "the title is where the tab is. or calm the room and look behind.", "read the browser tab title (or turn on ☾ calm) and do what it says."],
  floatWords: ["TITLE", "TAB", "↑", "UP THERE", "IGNORE", "OBEY"],
  prep(L) {
    L.cmd = L.pick([{ text: "TAP THE EYE THREE TIMES", act: "eye", n: 3 }, { text: "TAP THE BOTTOM RIGHT CORNER", act: "corner" },
      { text: "DO NOTHING FOR FIVE SECONDS", act: "still" }, { text: "TAP THE EYE ONCE", act: "eye", n: 1 }]);
  },
  words: () => [W_(["IGNORE", "OBEY", "READ"]), W_("THE"), W_("TITLE")],
  title: (L, f) => (f % 6 >= 3 ? L.cmd.text.toLowerCase() : null),
  setup(L) { L.eyes = 0; L.start = now(); scatter(22); },
  update(L) { if (L.cmd.act === "still") L.p = (now() - Math.max(S.lastInput, L.start)) / 5; },
  onEye(L) { if (L.cmd.act === "eye") { L.eyes++; blinkMeter(); if (L.eyes >= L.cmd.n) L.p = 1; } },
  onTap(L, wx, wy, x, y) { if (L.cmd.act === "corner" && x > W - 100 && y > H - 100) L.p = 1; },
  drawTop(L) { if (S.calm) { ctx.save(); ctx.globalAlpha = 0.35; drawText(L.cmd.text, Math.min(W / 22, 30), "#fff", W / 2, H * 0.62); ctx.restore(); } },
  teardown() { document.title = "MYSTERLE"; },
  async cheat(L, T) {
    if (L.cmd.act === "eye") for (let i = 0; i < L.cmd.n; i++) T.eye();
    if (L.cmd.act === "corner") T.tap(W - 20, H - 20);
    if (L.cmd.act === "still") await T.step(6);
  },
});

def({
  id: "timer", tier: 3, fam: "hud",
  reveal: "THE CLOCK IN THE CORNER WAS A TOOL.",
  hints: ["which timer?", "there is a clock at the top of the screen.", "tap when the last digit of the top timer shows that number. three times."],
  floatWords: ["⏱", "NOW", "WAIT", "0", "7", "TICK"],
  words: (L) => [W_("CLICK"), W_("WHEN"), W_("THE"), W_("TIMER"), W_("ENDS"), W_("IN"), W_(L.shuffle(numRange(0, 9)), { id: "d" })],
  setup(L) { L.hits = 0; L.lastSec = -1; scatter(18); },
  onTap(L) {
    const sec = Math.floor(S.runClock);
    if (sec % 10 === NUMVAL[get(L, "d")] && sec !== L.lastSec) { L.hits++; L.lastSec = sec; Snd.good(); popText(S.px, S.py, "✓", "#2bff88"); }
    else if (sec !== L.lastSec) { L.hits = 0; Snd.bad(); popText(S.px, S.py, "NOT NOW", "#ffb3c4"); }
    L.p = L.hits / 3;
  },
  async cheat(L, T) {
    const d = NUMVAL[get(L, "d")];
    for (let k = 0; k < 3 && S.L === L; k++) {
      for (let g = 0; g < 400 && Math.floor(S.runClock) % 10 !== d; g++) await T.step(0.05);
      T.tap(W * 0.3, H * 0.7); await T.step(1.1);
    }
  },
});

def({
  id: "morse", tier: 3, fam: "morse",
  reveal: "SHORT AND LONG ARE LETTERS TOO.",
  hints: ["the eye is trying to say something.", "watch the light: short flashes and long ones. you can press short and long.", "copy the pattern: quick taps for short flashes, long presses for long ones."],
  floatWords: ["·", "—", "···", "———", "SOS", "BEEP"],
  prep(L) { L.pat = Array.from({ length: L.int(3, 4) }, () => (L.chance(0.5) ? "." : "-")); if (L.pat.every((x) => x === L.pat[0])) L.pat[1] = L.pat[0] === "." ? "-" : "."; },
  words: () => [W_("REPEAT"), W_("AFTER"), W_("ME")],
  setup(L) { L.play = 0; L.input = []; L.lastUp = 0; scatter(16); },
  // when is the light on? the pattern plays every 5 seconds
  lit(L) {
    let t = (L.t % 5) - 0.5;
    for (const s of L.pat) { const d = s === "." ? 0.2 : 0.7; if (t >= 0 && t < d) return s; t -= d + 0.3; }
    return null;
  },
  update(L) {
    const s = L.def.lit(L);
    if (s && !L.on) { Snd.beep(s === "-"); pulseMeter(); }
    L.on = s;
    if (L.input.length && now() - L.lastUp > 1.6) { L.input = []; typedEl.textContent = ""; }
  },
  onUp(L, g) {
    L.input.push(g.dur < 0.32 ? "." : "-"); L.lastUp = now();
    typedEl.textContent = L.input.join(" ").replace(/\./g, "·").replace(/-/g, "—");
    const k = L.input.length - 1;
    if (L.input[k] !== L.pat[k]) { L.input = []; Snd.bad(); return; }
    if (L.input.length === L.pat.length) L.p = 1;
  },
  drawTop(L) {
    if (!L.on) return;
    ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(W / 2, H * 0.58, L.on === "-" ? 46 : 30, 0, 7); ctx.fill(); ctx.restore();
  },
  async cheat(L, T) { for (const s of L.pat) { await T.hold(W * 0.3, H * 0.7, s === "." ? 0.1 : 0.5); await T.step(0.2); } },
});

function padRects() {
  const s = Math.min(W, H) * 0.16, cx = W / 2, cy = H * 0.6, g = s * 1.15;
  return [[cx - g, cy - g / 2], [cx + g, cy - g / 2], [cx - g, cy + g * 0.75], [cx + g, cy + g * 0.75]].map(([x, y]) => ({ x, y, s }));
}
function simonLayer(id, tier, len, moving) {
  return def({
    id, tier, fam: "simon",
    reveal: moving ? "MEMORY DOESN'T CARE WHERE THINGS MOVE." : "REMEMBER WHAT YOU SAW.",
    hints: ["the colors are speaking in order.", "watch the four pads light up. then it's your turn.", "tap the pads in the same order they lit up."],
    floatWords: ["1", "2", "3", "4", "AGAIN", "ORDER"],
    prep(L) { L.seq = Array.from({ length: len }, () => L.int(0, 3)); },
    words: () => [W_("DO"), W_("WHAT"), W_("THEY"), W_("DID")],
    setup(L) {
      L.step = 0; L.showT = 1;
      const cols = ["RED", "BLUE", "GREEN", "YELLOW"];
      L.pads = padRects().map((r, i) => {
        const o = mk("pad", cols[i], { r: r.s / 2, hw: r.s / 2, hh: r.s / 2, x: r.x, y: r.y, fixed: !moving, base: 30, lit: 0, idx: i,
          draw(q) { ctx.globalAlpha = q.lit > 0 ? 1 : 0.35; ctx.fillStyle = COLORS[q.color]; ctx.fillRect(-q.hw, -q.hh, q.hw * 2, q.hh * 2); } });
        objs.push(o); return o;
      });
    },
    update(L, dt) {
      for (const p of L.pads) p.lit = Math.max(0, p.lit - dt);
      L.showT -= dt;
      if (L.showT <= 0 && L.step === 0) {
        // play the sequence
        L.showT = L.seq.length * 0.7 + 3;
        L.seq.forEach((k, i) => setTimeout(() => { if (S.L === L) { L.pads[k].lit = 0.45; Snd.note(k); } }, i * 700));
        if (S.test) L.pads[L.seq[0]].lit = 0.45;
      }
      L.p = L.step / L.seq.length;
    },
    onTap(L, x, y) {
      const p = hitObj(x, y, (o) => L.pads.includes(o));
      if (!p) return;
      p.lit = 0.3; Snd.note(p.idx);
      if (p.idx === L.seq[L.step]) L.step++;
      else { L.step = 0; L.showT = 0.8; Snd.bad(); popText(S.px, S.py, "NO.", "#ff6b7d"); }
    },
    async cheat(L, T) { for (const k of L.seq) T.tapWorld(L.pads[k]); },
  });
}
simonLayer("simon", 3, 4, false);

def({
  id: "letgo", tier: 3, fam: "hold",
  reveal: "LETTING GO IS ALSO TIMING.",
  hints: ["hold on. but not forever.", "press and hold. the sentence will change. react.", "hold anywhere, and release the moment it says LET GO. twice."],
  floatWords: ["NOW", "NOT YET", "HOLD", "GO", "GRIP", "!!"],
  words: () => [W_("HOLD"), W_("ON")],
  setup(L) { L.wins = 0; L.goAt = null; L.goEnd = 0; scatter(16); },
  setText(L, t) { L.words = t.split(" ").map((x) => W_(x)); renderWords(); },
  update(L) {
    if (S.down && L.goAt == null) L.goAt = now() + rand(1.2, 3);
    if (L.goAt != null && now() >= L.goAt && !L.go) { L.go = true; L.goEnd = now() + 0.7; L.def.setText(L, "LET GO"); Snd.beep(false); }
    if (L.go && now() > L.goEnd) { L.go = false; L.goAt = null; L.wins = 0; L.def.setText(L, "HOLD ON"); if (S.down) popText(S.px, S.py, "TOO LATE.", "#ffb3c4"); }
    if (!S.down && L.goAt != null && !L.go) L.goAt = null;
    L.p = L.wins / 2;
  },
  onUp(L) {
    if (L.go) { L.wins++; L.go = false; L.goAt = null; Snd.good(); L.def.setText(L, "HOLD ON"); }
    else if (L.goAt != null) { L.wins = 0; L.goAt = null; popText(S.px, S.py, "TOO SOON.", "#ffb3c4"); }
  },
  async cheat(L, T) {
    for (let k = 0; k < 2 && S.L === L; k++) {
      T.down(W * 0.3, H * 0.7);
      for (let g = 0; g < 200 && !L.go; g++) await T.step(0.05);
      T.up(W * 0.3, H * 0.7); await T.step(0.2);
    }
  },
});

def({
  id: "silence", tier: 3, fam: "react",
  reveal: "THE GAPS ARE WHERE IT LISTENS.",
  hints: ["sometimes everything stops.", "in the stillness, act.", "tap only while everything is frozen. three times."],
  floatWords: ["NOW", "WAIT", "...", "SHH", "STOP", "GO"],
  words: () => [W_("WAIT"), W_("FOR"), W_("THE"), W_("SILENCE")],
  setup(L) { L.hits = 0; L.next = now() + rand(2, 4); L.frozen = false; scatter(30, { base: 150 }); },
  update(L) {
    if (!L.frozen && now() >= L.next) { L.frozen = true; L.until = now() + 1.3; S.worldSpeed = 0; floatLayer.classList.add("paused"); Snd.droneLevel = 0; }
    if (L.frozen && now() >= L.until) { L.frozen = false; L.next = now() + rand(2.5, 5); S.worldSpeed = 1; floatLayer.classList.remove("paused"); Snd.droneLevel = 1; }
    L.p = L.hits / 3;
  },
  onTap(L) {
    if (L.frozen) { L.hits++; Snd.good(); L.until = Math.min(L.until, now() + 0.1); }
    else { L.hits = 0; Snd.bad(); popText(S.px, S.py, "TOO LOUD.", "#ffb3c4"); }
  },
  teardown() { floatLayer.classList.remove("paused"); },
  async cheat(L, T) {
    for (let k = 0; k < 3 && S.L === L; k++) { for (let g = 0; g < 300 && !L.frozen; g++) await T.step(0.05); T.tap(W * 0.3, H * 0.7); await T.step(0.3); }
  },
});

def({
  id: "late", tier: 3, fam: "react",
  reveal: "BEING EARLY IS ALSO WRONG.",
  hints: ["3, 2, 1...", "wait for it. exactly.", "tap right when it says NOW (or allow yourself to be late)."],
  floatWords: ["3", "2", "1", "NOW", "LATE", "EARLY"],
  words: () => [W_("DON'T"), W_("BE"), W_(["LATE", "EARLY", "SAD"], { id: "w" })],
  setup(L) { L.c0 = now(); scatter(16); },
  phase(L) { const t = now() - L.c0; return t < 2.7 ? "count" : t < 3.1 ? "now" : t < 6 ? "after" : "reset"; },
  update(L) { if (L.def.phase(L) === "reset") L.c0 = now(); },
  onTap(L) {
    const ph = L.def.phase(L), w = get(L, "w");
    if (ph === "now" || (w === "EARLY" && ph === "after")) L.p = 1;
    else { popText(S.px, S.py, ph === "count" ? "EARLY." : "LATE.", "#ffb3c4"); Snd.bad(); L.c0 = now(); }
  },
  drawTop(L) {
    const ph = L.def.phase(L), t = now() - L.c0;
    const txt = ph === "count" ? String(3 - Math.floor(t / 0.9)) : ph === "now" ? "NOW" : "";
    if (txt) { ctx.save(); ctx.globalAlpha = 0.9; drawText(txt, Math.min(W / 5, 140), ph === "now" ? "#2bff88" : "#fff", W / 2, H * 0.6); ctx.restore(); }
  },
  async cheat(L, T) { for (let g = 0; g < 200 && L.def.phase(L) !== "now"; g++) await T.step(0.03); T.tap(W * 0.3, H * 0.7); },
});

const ANAGRAMS = [["HEART", "EARTH", "HATER"], ["LISTEN", "SILENT", "ENLIST", "TINSEL", "INLETS"], ["GARDEN", "DANGER", "RANGED"],
  ["NIGHT", "THING"], ["OPEN", "NOPE", "PEON"], ["DREAM", "ARMED"], ["CANDLE", "LANCED"], ["WORDS", "SWORD"], ["SECRET", "RESECT"],
  ["MIRROR"], ["PUZZLE"], ["SPIDER", "PRIDES"]];
function scrambledLetters(L, word, accept) {
  let s;
  do { s = L.shuffle(word.split("")); } while (accept.includes(s.join("")));
  return s;
}
async function cheatSpell(L, T, w, target) {
  for (let i = 0; i < target.length; i++) {
    if (w.letters[i] === target[i]) continue;
    const j = w.letters.findIndex((c, k) => k > i && c === target[i]);
    T.tapWord(w.id, i); T.tapWord(w.id, j);
  }
}
def({
  id: "spell", tier: 3, fam: "letters",
  reveal: "LETTERS ARE WORDS THAT FELL APART.",
  hints: ["that's not a word.", "the letters can trade places: tap one, then another.", "swap letters until they spell a real word."],
  floatWords: ["ABC", "SPELL", "WORD?", "↔", "LETTERS", "OOPS"],
  prep(L) { L.set = L.pick(ANAGRAMS); },
  words: (L) => [W_("FIX"), W_("ME:"), W_("", { id: "x", letters: scrambledLetters(L, L.set[0], L.set) })],
  setup() { scatter(18); },
  update(L, dt) { fillIf(L, L.set.includes(get(L, "x")), dt, 0.8, 1); },
  async cheat(L, T) { await cheatSpell(L, T, T.word("x"), L.set[0]); },
});

def({
  id: "lock", tier: 3, fam: "letters",
  reveal: "A CODE IS JUST A WORD IN DISGUISE.",
  hints: ["the code is written somewhere. not plainly.", "look at the screen through a mirror. or calm the room.", "find the mirrored word on the screen and dial it in, letter by letter."],
  floatWords: ["🔒", "CODE", "KEY", "ACCESS DENIED", "****", "0000"],
  prep(L) {
    L.code = L.pick(["MOTH", "ECHO", "TIDE", "OPAL", "SOUP", "WICK", "FERN", "LAMP", "DUSK", "RUNE"]);
    L.wheel = L.code.split("").map((c) => L.shuffle([c, ...L.shuffle("ABCDEFGHIJKLMNOPRSTUVWY".replace(c, "").split("")).slice(0, 4)]));
    L.start = L.wheel.map((opts, i) => (opts[0] === L.code[i] ? opts[1] : opts[0]));
  },
  words: (L) => [W_("THE"), W_("CODE"), W_("IS"), W_("", { id: "x", letters: L.start.slice(), mode: "wheel", wheel: L.wheel })],
  setup() { scatter(20); },
  update(L, dt) { fillIf(L, get(L, "x") === L.code, dt, 0.8, 1); },
  drawTop(L) {
    ctx.save(); ctx.translate(W * 0.5, H * 0.66); ctx.scale(-1, 1); ctx.globalAlpha = S.calm ? 0.55 : 0.22;
    drawText(L.code, Math.min(W / 8, 64), "#2af0ff"); ctx.restore();
  },
  async cheat(L, T) { const w = T.word("x"); for (let i = 0; i < L.code.length; i++) for (let g = 0; g < 6 && w.letters[i] !== L.code[i]; g++) T.tapWord("x", i); },
});

def({
  id: "memory", tier: 3, fam: "type",
  reveal: "IT WAS ONLY THERE FOR A MOMENT.",
  hints: ["did you see that?", "a word flashes, now and then. (calm mode holds it longer.)", "catch the flashing word and type it."],
  floatWords: () => SECRET_WORDS,
  prep(L) { L.ans = L.pick(SECRET_WORDS); },
  words: () => ["WHAT", "WAS", "THE", "WORD?"].map((t) => W_(t, { editable: true })),
  answers: (L) => [L.ans],
  setup(L) { L.showT = 1; L.show = 0; scatter(22); },
  update(L, dt) {
    L.showT -= dt; L.show -= dt;
    if (L.showT <= 0) { L.showT = 12; L.show = S.calm ? 2 : 0.5; }
  },
  drawTop(L) { if (L.show > 0) { ctx.save(); drawText(L.ans, Math.min(W / (L.ans.length * 0.8), 150), "#fff", W / 2, H * 0.58); ctx.restore(); } },
  async cheat(L, T) { T.type(L.ans.toLowerCase()); },
});

def({
  id: "myname", tier: 3, fam: "type",
  reveal: "YOU KNEW IT ALL ALONG.",
  hints: ["you know my name.", "it's written all over the place. top left, for example.", "type the name of this game."],
  floatWords: ["WHO AM I?", "NAME", "???", "HELLO", "M_____E", "IT'S ME"],
  words: () => ["WHAT", "IS", "MY", "NAME?"].map((t) => W_(t, { editable: true })),
  answers: () => ["MYSTERLE"],
  setup() { scatter(22); },
  async cheat(L, T) { T.type("mysterle"); },
});

def({
  id: "feed", tier: 3, fam: "drag",
  reveal: "THE EYE IS HUNGRY FOR WHAT YOU SAY.",
  hints: ["the eye is hungry.", "things can be carried. press and drag.", "drag the right things into the eye at the bottom."],
  floatWords: ["YUM", "HUNGRY", "FEED ME", "NOM", "👁", "MORE"],
  drag: true,
  words: (L) => [W_("FEED"), W_("THE"), W_("EYE"), W_(["FIVE", "THREE", "ONE", "NINE"], { id: "n" }), W_(L.shuffle(COLOR_KEYS), { id: "c" }), W_("THINGS")],
  setup(L) {
    L.fed = 0;
    for (const c of COLOR_KEYS) for (let i = 0; i < 3; i++) objs.push(mk(pick(["square", "circle", "tri", "star"]), c, { r: 18, base: 25, draggable: true }));
  },
  onWord(L) { L.fed = 0; },
  onDrop(L, o) {
    const m = meterCenter(), s = toScreen(o.x, o.y);
    if (Math.hypot(s.x - m.x, s.y - m.y) > m.r + 30) return;
    if (o.color === get(L, "c")) { popObj(o); L.fed++; pulseMeter(); Snd.good(); }
    else { o.vy = -500; Snd.bad(); popText(m.x, m.y - 70, "BLEH.", "#ffb3c4"); }
  },
  update(L) { L.p = L.fed / NUMVAL[get(L, "n")]; },
  async cheat(L, T) {
    T.cycleTo("n", "ONE");
    const c = get(L, "c"), o = objs.find((q) => q.color === c), m = meterCenter(), w = toWorld(m.x, m.y);
    T.drag(o, w.x, w.y);
  },
});

def({
  id: "sort", tier: 3, fam: "drag",
  reveal: "PLACES ARE ALSO WORDS.",
  hints: ["they're all mixed up.", "drag things where the sentence wants them.", "move every circle and every square to the half of the screen the sentence names."],
  floatWords: ["SORT", "ORDER", "MESS", "UP", "DOWN", "◯", "■"],
  drag: true,
  words: (L) => [W_("CIRCLES"), W_(L.shuffle(["UP", "DOWN", "LEFT", "RIGHT"]), { id: "a" }), W_(","), W_("SQUARES"), W_(L.shuffle(["DOWN", "UP", "RIGHT", "LEFT"]), { id: "b" })],
  setup(L) {
    for (let i = 0; i < 4; i++) {
      objs.push(mk("circle", "BLUE", { r: 20, base: 6, draggable: true, x: rand(W * 0.3, W * 0.7), y: rand(H * 0.4, H * 0.75) }));
      objs.push(mk("square", "YELLOW", { r: 18, base: 6, draggable: true, x: rand(W * 0.3, W * 0.7), y: rand(H * 0.4, H * 0.75) }));
    }
  },
  inside(o, dir) { return dir === "UP" ? o.y < H / 2 : dir === "DOWN" ? o.y > H / 2 : dir === "LEFT" ? o.x < W / 2 : o.x > W / 2; },
  update(L, dt) {
    const a = get(L, "a"), b = get(L, "b");
    const ok = objs.filter((o) => o.shape === "circle").every((o) => L.def.inside(o, a)) && objs.filter((o) => o.shape === "square").every((o) => L.def.inside(o, b));
    fillIf(L, ok, dt, 1, 1);
  },
  drawWorld() { ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.setLineDash([]); },
  async cheat(L, T) {
    const at = (dir) => ({ UP: [W * 0.5 + rand(-80, 80), H * 0.3], DOWN: [W * 0.5 + rand(-80, 80), H * 0.8], LEFT: [W * 0.2, H * 0.4 + rand(0, 200)], RIGHT: [W * 0.8, H * 0.4 + rand(0, 200)] })[dir];
    T.cycleTo("a", "UP"); T.cycleTo("b", "DOWN");
    for (let g = 0; g < 60 && S.L === L; g++) {
      const o = objs.find((q) => !L.def.inside(q, q.shape === "circle" ? "UP" : "DOWN"));
      if (!o) break;
      const [x, y] = at(o.shape === "circle" ? "UP" : "DOWN"); T.drag(o, x, y);
    }
  },
});

def({
  id: "dots", tier: 3, fam: "order",
  reveal: "ORDER IS WHATEVER THE SENTENCE SAYS.",
  hints: ["connect them. but how?", "the sentence tells you the order.", "tap the dots in the order the sentence says (by number, backwards, or by size)."],
  floatWords: ["1", "2", "3", "→", "•", "CONNECT"],
  prep(L) { const n = L.int(5, 7); L.labels = L.shuffle(Array.from({ length: 30 }, (_, i) => i + 1)).slice(0, n); L.sizes = L.shuffle(L.labels.map((_, i) => 12 + i * 4)); },
  words: () => [W_("CONNECT"), W_("THE"), W_("DOTS"), W_(["IN ORDER", "BACKWARDS", "BY SIZE"], { id: "o" })],
  setup(L) {
    L.done = [];
    const spots = [];
    const free = () => {
      // keep the dots apart so a tap never lands on two of them
      for (let g = 0; g < 200; g++) {
        const p = { x: rand(W * 0.12, W * 0.88), y: rand(H * 0.38, H * 0.85) };
        if (spots.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > 80)) { spots.push(p); return p; }
      }
      const p = { x: rand(W * 0.12, W * 0.88), y: rand(H * 0.38, H * 0.85) }; spots.push(p); return p;
    };
    L.dots = L.labels.map((lab, i) => {
      const at = free();
      const o = mk("dot", "#fff", { r: L.sizes[i], x: at.x, y: at.y, fixed: true, label: String(lab), labelColor: "#000", labelSize: 16, lab, size: L.sizes[i],
        draw(q) { ctx.fillStyle = L.done.includes(q) ? "#2bff88" : "#fff"; ctx.beginPath(); ctx.arc(0, 0, q.r, 0, 7); ctx.fill(); drawText(q.label, 15, "#000"); } });
      objs.push(o); return o;
    });
  },
  order(L) {
    const o = get(L, "o"), d = L.dots.slice();
    if (o === "IN ORDER") return d.sort((a, b) => a.lab - b.lab);
    if (o === "BACKWARDS") return d.sort((a, b) => b.lab - a.lab);
    return d.sort((a, b) => a.size - b.size);
  },
  onWord(L) { L.done = []; },
  onTap(L, x, y) {
    const d = hitObj(x, y, (o) => L.dots.includes(o) && !L.done.includes(o));
    if (!d) return;
    if (L.def.order(L)[L.done.length] === d) { L.done.push(d); Snd.note(L.done.length); }
    else { L.done = []; Snd.bad(); popText(S.px, S.py, "NO.", "#ff6b7d"); }
    L.p = L.done.length / L.dots.length;
  },
  drawWorld(L) {
    if (L.done.length < 2) return;
    ctx.strokeStyle = "#2bff88"; ctx.lineWidth = 3; ctx.beginPath();
    L.done.forEach((d, i) => (i ? ctx.lineTo(d.x, d.y) : ctx.moveTo(d.x, d.y))); ctx.stroke();
  },
  async cheat(L, T) { for (const d of L.def.order(L)) T.tapWorld(d); },
});

def({
  id: "gravity", tier: 3, fam: "world",
  reveal: "DOWN IS A WORD.",
  hints: ["the gold ball wants to go somewhere.", "gravity is in the sentence. so it can point anywhere.", "point gravity towards the glowing goal."],
  floatWords: ["⬇", "⬆", "⬅", "➡", "FALL", "FLOAT"],
  prep(L) { L.goal = L.pick(["LEFT", "RIGHT", "UP"]); },
  words: () => [W_("GRAVITY"), W_("IS"), W_(["DOWN", "UP", "LEFT", "RIGHT", "OFF"], { id: "g" })],
  setup(L) {
    L.ball = mk("circle", "YELLOW", { r: 20, x: W / 2, y: H * 0.7, base: 900, bounce: 0.4, noDamp: true });
    objs.push(L.ball);
    for (const o of scatter(18)) { o.base = 900; o.bounce = 0.5; o.noDamp = true; }
  },
  update(L, dt) {
    const g = get(L, "g"), G = 700;
    const [gx, gy] = ({ DOWN: [0, G], UP: [0, -G], LEFT: [-G, 0], RIGHT: [G, 0], OFF: [0, 0] })[g];
    for (const o of objs) { o.gx = gx; o.gy = gy; o.vx *= 1 - dt * 0.6; o.vy *= 1 - dt * 0.6; }
    const b = L.ball, k = 70;
    const inGoal = L.goal === "LEFT" ? b.x < k : L.goal === "RIGHT" ? b.x > W - k : b.y < k;
    fillIf(L, inGoal, dt, 0.8, 1);
  },
  drawWorld(L) {
    ctx.fillStyle = "rgba(43,255,136,.25)";
    if (L.goal === "LEFT") ctx.fillRect(0, 0, 70, H); else if (L.goal === "RIGHT") ctx.fillRect(W - 70, 0, 70, H); else ctx.fillRect(0, 0, W, 70);
  },
  async cheat(L, T) { T.cycleTo("g", L.goal); await T.step(4); },
});

def({
  id: "time", tier: 3, fam: "world",
  reveal: "TIME OBEYS GRAMMAR.",
  hints: ["everything is too fast.", "time itself is in the sentence.", "stop time, then catch the gold."],
  floatWords: ["⏸", "⏪", "⏩", "NOW", "THEN", "TICK"],
  words: () => [W_("TIME"), W_("IS"), W_(["FAST", "NORMAL", "SLOW", "STOPPED", "BACKWARDS"], { id: "t" })],
  setup(L) { L.gold = mk("star", "YELLOW", { r: 15, base: 1100, vr: 9, flee: 200 }); objs.push(L.gold); scatter(30, { base: 260 }); },
  update(L) {
    const t = get(L, "t");
    S.worldSpeed = ({ FAST: 1.8, NORMAL: 1, SLOW: 0.25, STOPPED: 0, BACKWARDS: -1 })[t];
    floatLayer.classList.toggle("paused", t === "STOPPED");
  },
  onTap(L, x, y) { if (hitObj(x, y, (o) => o === L.gold)) L.p = 1; },
  teardown() { floatLayer.classList.remove("paused"); },
  async cheat(L, T) { T.cycleTo("t", "STOPPED"); await T.step(0.1); T.tapWorld(L.gold); },
});

def({
  id: "walls", tier: 3, fam: "world",
  reveal: "WALLS LISTEN TO SENTENCES.",
  hints: ["they're coming closer.", "the walls do what the sentence says they do.", "make the walls OPEN up and wait until they're gone."],
  floatWords: ["HELP", "TIGHT", "SQUISH", "CLOSER", "AIR", "▮▮"],
  words: () => [W_("THE"), W_("WALLS"), W_("ARE"), W_(["CLOSING", "PAINTED", "OPENING", "LISTENING"], { id: "s" })],
  setup(L) { L.wall = 0.12; scatter(22); },
  update(L, dt) {
    const s = get(L, "s");
    if (s === "CLOSING") L.wall += dt * 0.025;
    else if (s === "OPENING") L.wall -= dt * 0.06;
    if (L.wall >= 0.47) { L.wall = 0.12; shake(); Snd.thud(); popText(W / 2, H * 0.6, "SQUISHED.", "#ff6b7d", true); }
    if (L.wall <= 0) L.p = 1;
    L.showP = 1 - L.wall / 0.47;
  },
  drawTop(L) {
    const w = Math.max(0, L.wall) * W;
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, "#1a0b2a"); g.addColorStop(1, "#4a2a6a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, H);
    const g2 = ctx.createLinearGradient(W, 0, W - w, 0); g2.addColorStop(0, "#1a0b2a"); g2.addColorStop(1, "#4a2a6a");
    ctx.fillStyle = g2; ctx.fillRect(W - w, 0, w, H);
  },
  async cheat(L, T) { T.cycleTo("s", "OPENING"); await T.step(4); },
});

def({
  id: "focus", tier: 3, fam: "decoy",
  reveal: "ATTENTION IS A LENS.",
  hints: ["it's all a blur.", "the words sharpen where you point.", "point at each word to read it, then do what it says."],
  floatWords: ["BLUR", "FOCUS", "👓", "SHARP", "SOFT", "?"],
  prep(L) { L.c = L.pick(COLOR_KEYS); L.s = L.pick(["SQUARE", "CIRCLE", "TRIANGLE", "STAR"]); },
  words: (L) => [W_("TAP"), W_("THE"), W_(L.c, { heavy: true }), W_(L.s, { heavy: true })],
  setup(L) {
    const sh = ({ SQUARE: "square", CIRCLE: "circle", TRIANGLE: "tri", STAR: "star" })[L.s];
    L.target = mk(sh, L.c, { r: 22, base: 50 }); objs.push(L.target);
    for (const o of scatter(22)) if (o.color === L.c && o.shape === sh) o.color = L.pick(COLOR_KEYS.filter((c) => c !== L.c));
  },
  update(L) {
    for (const w of L.words) {
      if (!w.el || !w.el.getBoundingClientRect) continue;
      const r = w.el.getBoundingClientRect(), d = Math.hypot(S.px - (r.left + r.width / 2), S.py - (r.top + r.height / 2));
      const b = clamp((d - 40) / 18, 0, 14);
      if (Math.abs((w.blur || 0) - b) > 0.3) { w.blur = b; paintWord(w); }
    }
  },
  onTap(L, x, y) { if (hitObj(x, y, (o) => o === L.target)) L.p = 1; },
  async cheat(L, T) { T.tapWorld(L.target); },
});

def({
  id: "fineprint", tier: 3, fam: "elsewhere",
  reveal: "THE TICKER WAS TALKING TO YOU.",
  hints: ["the password is somewhere on screen.", "not the big words. the running ones.", "read the scrolling ticker at the bottom (calm mode slows it), find the password and type it."],
  floatWords: () => SECRET_WORDS,
  prep(L) { L.ans = L.pick(SECRET_WORDS); },
  words: () => ["READ", "THE", "FINE", "PRINT"].map((t) => W_(t, { editable: true })),
  answers: (L) => [L.ans],
  setup(L) { $("tick-b").textContent = (TICKER_B + `✶ THE PASSWORD IS ${L.ans} ✶ `).repeat(5); scatter(20); },
  teardown() { $("tick-b").textContent = TICKER_B.repeat(6); },
  async cheat(L, T) { T.type(L.ans.toLowerCase()); },
});

def({
  id: "goldword", tier: 3, fam: "elsewhere",
  reveal: "ONE VOICE IN THE CROWD WAS GOLD.",
  hints: ["so many words floating by.", "one of them keeps coming back, always in gold.", "type the word that floats by in gold."],
  floatWords: () => SECRET_WORDS,
  prep(L) { L.ans = L.pick(SECRET_WORDS); },
  words: () => ["WHAT", "DOES", "THE", "GOLD", "ONE", "SAY?"].map((t) => W_(t, { editable: true })),
  answers: (L) => [L.ans],
  setup(L) { L.goldT = 0.5; scatter(20); },
  update(L, dt) {
    L.goldT -= dt;
    if (L.goldT <= 0) {
      L.goldT = S.calm ? 3 : 2.2;
      const el = spawnFloater("text", rand(10, 75), rand(30, 80), L.ans);
      if (el) { el.classList.add("goldfl"); el.style.color = "#ffcf4a"; el.style.fontSize = "40px"; }
    }
  },
  async cheat(L, T) { T.type(L.ans.toLowerCase()); },
});
