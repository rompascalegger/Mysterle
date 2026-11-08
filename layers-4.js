"use strict";
// Layers, tier 4 (the sentence is a puzzle in itself) and tier 5 (endings).

def({
  id: "caesar", tier: 4, fam: "type",
  reveal: "EVERY LETTER WAS ONE STEP AWAY.",
  hints: ["that word is broken.", "every letter has slipped along the alphabet by the same amount.", "shift each letter back (B→A, C→B...) by the number the sentence hints at, and type the result."],
  floatWords: ["ABC", "BCD", "+1", "-1", "SHIFT", "ROT"],
  prep(L) {
    L.ans = L.pick(SECRET_WORDS); L.k = L.int(1, 3);
    L.enc = L.ans.split("").map((c) => String.fromCharCode(((c.charCodeAt(0) - 65 + L.k) % 26) + 65)).join("");
  },
  words: (L) => [W_("DECODE", { editable: true }), W_(L.enc, { editable: true }), W_("(" + numWord(L.k) + ")", { editable: true })],
  answers: (L) => [L.ans],
  setup() { scatter(22); },
  async cheat(L, T) { T.type(L.ans.toLowerCase()); },
});

const SHAPE_WORD = { SQUARE: "square", CIRCLE: "circle", TRIANGLE: "tri", STAR: "star" };
def({
  id: "liar", tier: 4, fam: "decoy",
  reveal: "WHEN IT GLITCHES, IT TELLS THE TRUTH.",
  hints: ["one word of this sentence is a lie.", "watch the sentence closely. sometimes a word flickers.", "the flickering word is the true one. tap that thing instead."],
  floatWords: ["LIAR", "TRUE", "GLITCH", "WATCH", "FLICKER", "?"],
  prep(L) {
    const cs = L.shuffle(COLOR_KEYS), ss = L.shuffle(Object.keys(SHAPE_WORD));
    L.said = { c: cs[0], s: ss[0] };
    L.lieOn = L.pick(["c", "s"]);
    L.real = { c: L.lieOn === "c" ? cs[1] : cs[0], s: L.lieOn === "s" ? ss[1] : ss[0] };
  },
  words: (L) => [W_("TAP"), W_("THE"), W_(L.said.c, { id: "c", heavy: true }), W_(L.said.s, { id: "s", heavy: true })],
  lie: (L) => ({ w: wordById(L, L.lieOn), text: L.lieOn === "c" ? L.real.c : L.real.s }),
  setup(L) {
    L.target = mk(SHAPE_WORD[L.real.s], L.real.c, { r: 22, base: 50 }); objs.push(L.target);
    L.decoy = mk(SHAPE_WORD[L.said.s], L.said.c, { r: 22, base: 50 }); objs.push(L.decoy);
    for (const o of scatter(20)) if ((o.color === L.real.c && o.shape === SHAPE_WORD[L.real.s]) || (o.color === L.said.c && o.shape === SHAPE_WORD[L.said.s])) o.color = "#ffffff";
    L.lieT = 1.5;
  },
  update(L, dt) { L.lieT -= dt; if (L.lieT <= 0) { L.lieT = S.calm ? 3 : 2.4; wordLie(false); } },
  onTap(L, x, y) {
    if (hitObj(x, y, (o) => o === L.target)) { L.p = 1; return; }
    if (hitObj(x, y, (o) => o === L.decoy)) { Snd.bad(); popText(S.px, S.py, "THAT'S WHAT IT SAID.", "#ffb3c4"); }
  },
  async cheat(L, T) { T.tapWorld(L.target); },
});

def({
  id: "mirrorworld", tier: 4, fam: "mirror",
  reveal: "LEFT IS A MATTER OF PERSPECTIVE.",
  hints: ["something is backwards.", "the letters on the eyes are mirrored. so is everything else.", "make the world FORWARDS again, or tap the eye whose mirrored letter matches."],
  floatWords: ["ꟻ", "Я", "L", "R", "←", "→"],
  words: (L) => [W_("EVERYTHING"), W_("IS"), W_(["BACKWARDS", "FORWARDS"], { id: "m" }), W_("."), W_("TAP"), W_("THE"), W_(L.shuffle(["LEFT", "RIGHT"]), { id: "side" }), W_("EYE")],
  setup(L) {
    L.left = mk("eye", "BLUE", { r: 34, x: W * 0.3, y: H * 0.64, fixed: true, label: "L", labelColor: "#fff", labelSize: 26 });
    L.right = mk("eye", "PINK", { r: 34, x: W * 0.7, y: H * 0.64, fixed: true, label: "R", labelColor: "#fff", labelSize: 26 });
    for (const e of [L.left, L.right]) e.draw = (o) => { drawEye(o, COLORS[o.color]); drawText(o.label, 26, "#fff", 0, o.r * 1.4); };
    objs.push(L.left, L.right);
    scatter(16);
  },
  update(L) { S.worldFlipX = get(L, "m") === "BACKWARDS" ? -1 : 1; },
  onTap(L, x, y) {
    const e = hitObj(x, y, (o) => o === L.left || o === L.right);
    if (!e) return;
    if (e === (get(L, "side") === "LEFT" ? L.left : L.right)) L.p = 1;
    else { Snd.bad(); popText(S.px, S.py, "THE OTHER LEFT.", "#ffb3c4"); }
  },
  async cheat(L, T) { T.tapWorld(get(L, "side") === "LEFT" ? L.left : L.right); },
});

const TRUTHY = { TRUE: true, CORRECT: true, FALSE: false, "A LIE": false, WRONG: false };
def({
  id: "nested", tier: 4, fam: "logic",
  reveal: "TWO SENTENCES CAN AGREE.",
  hints: ["this is a paradox.", "if the first is right, the second is... and then the first is...", "make both sentences say the same thing (both true, or both false)."],
  floatWords: ["TRUE", "FALSE", "PARADOX", "∞", "LOOP", "?!"],
  words: () => [W_("THE"), W_("NEXT"), W_("SENTENCE"), W_("IS"), W_(["TRUE", "CORRECT", "FALSE", "A LIE", "WRONG"], { id: "a" }), W_("."),
    W_("THE"), W_("PREVIOUS"), W_("SENTENCE"), W_("IS"), W_(["FALSE", "A LIE", "WRONG", "TRUE", "CORRECT"], { id: "b" }), W_(".")],
  setup() { scatter(18); },
  update(L, dt) { fillIf(L, TRUTHY[get(L, "a")] === TRUTHY[get(L, "b")], dt, 2, 1); },
  async cheat(L, T) { T.cycleTo("b", "TRUE"); },
});

def({
  id: "vowels", tier: 4, fam: "self",
  reveal: "EVEN A LETTER CAN BE COUNTED BY ITSELF.",
  hints: ["count the E's.", "all of them. including the ones inside the number.", "find the number whose own E's make the count right."],
  floatWords: ["E", "EE", "EEE", "COUNT", "e", "Ǝ"],
  prep(L) {
    const pre = [["THIS", "SENTENCE", "CONTAINS"], ["HERE", "ARE"], ["I", "SEE"], ["THERE", "ARE"]];
    const post = [["E'S"], ["LETTER", "E'S"], ["E'S", "IN", "TOTAL"]];
    const es = (a) => a.join("").split("").filter((c) => c === "E").length;
    const forms = [];
    for (const p of pre) for (const q of post) {
      const fixed = [];
      for (let n = 1; n < 40; n++) if (es(p) + es(q) + es([numWord(n)]) === n) fixed.push(n);
      if (fixed.length) forms.push({ p, q, fixed });
    }
    L.form = L.pick(forms);
  },
  words: (L) => L.form.p.map((t) => W_(t)).concat([W_(startAway(numRange(1, 30), numWord(L.form.fixed[0]), L), { id: "n" })], L.form.q.map((t) => W_(t))),
  setup() { scatter(18); },
  update(L, dt) { fillIf(L, NUMVAL[get(L, "n")] === sentence(L).join("").split("").filter((c) => c === "E").length, dt, 1.5, 1); },
  async cheat(L, T) { T.cycleTo("n", numWord(L.form.fixed[0])); },
});

def({
  id: "behind", tier: 4, fam: "elsewhere",
  reveal: "SOMETHING WAS WRITTEN BEHIND THE WORDS.",
  hints: ["look behind the words.", "literally. words can be moved out of the way.", "drag the word BEHIND aside, read what's under it, and type it."],
  floatWords: () => SECRET_WORDS,
  prep(L) { L.ans = L.pick(SECRET_WORDS); },
  words: () => [W_("LOOK", { editable: true }), W_("BEHIND", { id: "b", editable: true, cls: "cover" }), W_("THE", { editable: true }), W_("WORDS", { editable: true })],
  answers: (L) => [L.ans],
  setup() { scatter(20); },
  update(L) {
    const w = wordById(L, "b");
    if (w && w.el && !S.dragging && w.el.classList.contains("word")) { const r = w.el.getBoundingClientRect(); if (r.width) L.rect = { x: r.left, y: r.top, w: r.width, h: r.height }; }
  },
  drawTop(L) {
    if (!L.rect) return;
    const r = L.rect, size = Math.min(r.h * 0.6, (r.w * 0.95) / (L.ans.length * 0.7));
    drawText(L.ans, size, "#ffe23a", r.x + r.w / 2, r.y + r.h / 2);
  },
  async cheat(L, T) { T.type(L.ans.toLowerCase()); },
});

def({
  id: "shepherd", tier: 4, fam: "herd",
  reveal: "CHOOSE WHO YOU CHASE.",
  hints: ["only some of them matter.", "they all run from you. you only need one color.", "herd the named color into the named corner; ignore the rest."],
  floatWords: ["BAA", "SHOO", "THIS ONE", "NOT THAT ONE", "🐑", "🐺"],
  words: (L) => [W_("HERD"), W_("THE"), W_(L.shuffle(["PINK", "GREEN", "YELLOW"]), { id: "c" }), W_("ONES"), W_(L.shuffle(["TOP LEFT", "TOP RIGHT", "BOTTOM LEFT", "BOTTOM RIGHT"]), { id: "z" })],
  zone(L) {
    const c = get(L, "z");
    return { x0: c.includes("LEFT") ? 0 : W * 0.62, y0: c.includes("TOP") ? 0 : H * 0.62, x1: c.includes("LEFT") ? W * 0.38 : W, y1: c.includes("TOP") ? H * 0.38 : H };
  },
  setup() { for (const c of ["PINK", "GREEN", "YELLOW"]) for (let i = 0; i < 4; i++) objs.push(mk("circle", c, { r: 14, base: 40, flee: 170, fleeForce: 1700, sheep: true })); },
  update(L, dt) {
    const z = L.def.zone(L), sh = objs.filter((o) => o.sheep && o.color === get(L, "c"));
    const inside = sh.filter((o) => o.x >= z.x0 && o.x <= z.x1 && o.y >= z.y0 && o.y <= z.y1).length;
    fillIf(L, inside >= sh.length - 1, dt, 1, 0.6);
  },
  drawWorld(L) { const z = L.def.zone(L); ctx.fillStyle = "rgba(43,255,136,.12)"; ctx.fillRect(z.x0, z.y0, z.x1 - z.x0, z.y1 - z.y0); },
  async cheat(L, T) {
    const z = L.def.zone(L), tx = (z.x0 + z.x1) / 2, ty = (z.y0 + z.y1) / 2;
    for (let round = 0; round < 80 && S.L === L; round++) {
      for (const o of objs.filter((q) => q.sheep && q.color === get(L, "c"))) {
        if (o.x >= z.x0 && o.x <= z.x1 && o.y >= z.y0 && o.y <= z.y1) continue;
        const dx = o.x - tx, dy = o.y - ty, d = Math.hypot(dx, dy) || 1;
        const s = toScreen(o.x + (dx / d) * 60, o.y + (dy / d) * 60); T.move(s.x, s.y); await T.step(0.05);
      }
    }
  },
});

simonLayer("simonlong", 4, 6, true);

def({
  id: "morselong", tier: 4, fam: "morse",
  reveal: "YOU CAN READ LIGHT.",
  hints: ["listen and watch. it's longer now.", "short and long, like before. but more of it.", "copy the whole pattern of short and long presses without a long pause."],
  floatWords: ["·—·", "—··", "···", "SIGNAL", "BEEP", "STATIC"],
  prep(L) { L.pat = Array.from({ length: L.int(5, 6) }, () => (L.chance(0.5) ? "." : "-")); L.pat[0] = "."; L.pat[1] = "-"; },
  words: () => [W_("SAY"), W_("IT"), W_("BACK")],
  setup(L) { L.input = []; L.lastUp = 0; scatter(16); },
  lit(L) {
    let t = (L.t % 7) - 0.5;
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
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(W / 2, H * 0.58, L.on === "-" ? 34 : 20, 0, 7); ctx.fill(); ctx.restore();
  },
  async cheat(L, T) { for (const s of L.pat) { await T.hold(W * 0.3, H * 0.7, s === "." ? 0.1 : 0.5); await T.step(0.2); } },
});

def({
  id: "anagramcmd", tier: 4, fam: "letters",
  reveal: "A COMMAND CAN BE HIDDEN IN A WORD.",
  hints: ["the first word makes no sense.", "its letters are shuffled. tap two letters to swap them.", "unscramble the first word, then do what the sentence says."],
  floatWords: ["?", "SPELL", "SCRAMBLE", "ORDER", "DO IT", "↔"],
  prep(L) { L.cmd = L.pick([{ v: "TAP", rest: ["THE", "EYE"], act: "eye" }, { v: "POKE", rest: ["THE", "EYE"], act: "eye" }, { v: "WAIT", rest: ["FOR", "IT"], act: "wait" }, { v: "TOUCH", rest: ["ANYWHERE"], act: "tap" }]); },
  words: (L) => [W_("", { id: "x", letters: scrambledLetters(L, L.cmd.v, [L.cmd.v]) })].concat(L.cmd.rest.map((t) => W_(t))),
  setup(L) { L.start = now(); scatter(18); },
  ok(L) { return get(L, "x") === L.cmd.v; },
  onWord(L) { L.start = now(); if (L.def.ok(L)) { wordById(L, "x").cls = "lit"; renderWords(); whisper("now do it.", 2); } },
  update(L) { if (L.cmd.act === "wait" && L.def.ok(L)) L.p = (now() - Math.max(S.lastInput, L.start)) / 4; },
  onEye(L) { if (L.cmd.act === "eye" && L.def.ok(L)) L.p = 1; },
  onTap(L) { if (L.cmd.act === "tap" && L.def.ok(L)) L.p = 1; },
  async cheat(L, T) {
    await cheatSpell(L, T, T.word("x"), L.cmd.v);
    if (L.cmd.act === "eye") T.eye(); else if (L.cmd.act === "tap") T.tap(W * 0.3, H * 0.7); else await T.step(5);
  },
});

def({
  id: "doublenot", tier: 4, fam: "negation",
  reveal: "SOME NOTS ARE GLUED. SOME AREN'T.",
  hints: ["count the NOTs.", "an even number of NOTs cancels out. some of them can be removed.", "drag NOTs away until their number is even. not every NOT will move."],
  floatWords: ["NOT", "NOT NOT", "KNOT", "¬", "!", "NO"],
  prep(L) { L.k = L.pick([3, 5]); L.free = L.int(1, L.k - 1); L.freeAt = L.shuffle(Array.from({ length: L.k }, (_, i) => i)).slice(0, L.free); },
  words: (L) => [W_("YOU"), W_("WILL")].concat(Array.from({ length: L.k }, (_, i) => W_("NOT", { id: "n" + i, heavy: true, removable: L.freeAt.includes(i) }))).concat([W_("WIN")]),
  setup() { scatter(18); },
  update(L, dt) { fillIf(L, sentence(L).filter((x) => x === "NOT").length % 2 === 0, dt, 1.2, 1); },
  async cheat(L, T) { T.remove("n" + L.freeAt[0]); },
});

def({
  id: "truthtable", tier: 4, fam: "ink",
  reveal: "THE SENTENCE WAS PAINTED, NOT JUST WRITTEN.",
  hints: ["count colors, not words.", "each word is painted. the number and the color can both change.", "set the number to how many words of the sentence are painted in the named color."],
  floatWords: ["RED", "BLUE", "COUNT", "INK", "PAINT", "🎨"],
  prep(L) {
    const cols = ["RED", "BLUE", "GREEN", "YELLOW"];
    L.inks = Array.from({ length: 7 }, () => L.pick(cols));
  },
  words: (L) => {
    const base = ["EXACTLY", null, "OF", "THESE", "WORDS", "ARE", null];
    return base.map((t, i) => (i === 1 ? W_(startAway(numRange(0, 7), "", L), { id: "n", ink: INK[L.inks[i]] })
      : i === 6 ? W_(["RED", "BLUE", "GREEN", "YELLOW"], { id: "c", ink: INK[L.inks[i]] }) : W_(t, { ink: INK[L.inks[i]] })));
  },
  setup() { scatter(16); },
  count(L) { const c = get(L, "c"); return L.words.filter((w) => w.ink === INK[c]).length; },
  update(L, dt) { fillIf(L, NUMVAL[get(L, "n")] === L.def.count(L), dt, 1.5, 1); },
  async cheat(L, T) { T.cycleTo("n", numWord(L.def.count(L))); },
});

def({
  id: "echo", tier: 4, fam: "elsewhere",
  reveal: "THE VOICE WAS REAL.",
  hints: ["did you hear that?", "sound on. or, if you can't listen, calm the room and look.", "type the word the voice says (it also shows faintly in ☾ calm mode)."],
  floatWords: () => SECRET_WORDS,
  prep(L) { L.ans = L.pick(SECRET_WORDS); },
  words: () => ["WHAT", "DID", "IT", "SAY?"].map((t) => W_(t, { editable: true })),
  answers: (L) => [L.ans],
  setup(L) { L.sayT = 1; scatter(20); },
  update(L, dt) { L.sayT -= dt; if (L.sayT <= 0) { L.sayT = 6; speak(L.ans.toLowerCase(), true); Snd.tone(200, 0.2, "sine", 0.05); } },
  drawTop(L) { if (S.calm) { ctx.save(); ctx.globalAlpha = 0.28; drawText(L.ans, Math.min(W / (L.ans.length * 0.8), 120), "#fff", W / 2, H * 0.6); ctx.restore(); } },
  teardown() { if (window.speechSynthesis) speechSynthesis.cancel(); },
  async cheat(L, T) { T.type(L.ans.toLowerCase()); },
});

const ORIGINALS = [
  ["THE", "CAT", "SAT", "ON", "THE", "MAT"], ["THE", "MOON", "IS", "MADE", "OF", "GLASS"], ["EVERY", "DOOR", "OPENS", "TWICE"],
  ["NOBODY", "KNOWS", "THE", "SEVENTH", "RULE"], ["THE", "EYE", "NEVER", "SLEEPS"],
];
const ALTS = ["DOG", "STOOD", "UNDER", "A", "RUG", "SUN", "WAS", "PAPER", "SAND", "ALL", "WINDOW", "CLOSES", "ONCE", "EVERYONE", "FORGETS", "FIRST", "WORD", "HAND", "ALWAYS", "WAKES"];
def({
  id: "putback", tier: 4, fam: "memory",
  reveal: "YOU REMEMBERED HOW IT WAS.",
  hints: ["it was different a moment ago.", "the sentence was changed after you saw it. change it back. (calm mode remembers.)", "restore the original sentence: right words, right order."],
  floatWords: ["UNDO", "CTRL+Z", "BEFORE", "AFTER", "↺", "REMEMBER"],
  prep(L) { L.orig = L.pick(ORIGINALS); },
  words: (L) => L.orig.map((t, i) => W_(L.shuffle([t, L.pick(ALTS), L.pick(ALTS)]), { id: "w" + i, orig: t })),
  setup(L) {
    for (const w of L.words) setWordTo(w, w.orig);
    L.scrambled = false; L.showT = 2.5;
    scatter(16);
  },
  update(L, dt) {
    if (!L.scrambled) {
      L.showT -= dt;
      if (L.showT <= 0) {
        L.scrambled = true;
        const ws = L.shuffle(L.words);
        for (const w of ws.slice(0, 2)) { w.i = w.opts.findIndex((o) => o !== w.orig); }
        const a = L.words.indexOf(ws[2]), b = L.words.indexOf(ws[3]);
        if (wtext(ws[2]) !== wtext(ws[3])) { L.words[a] = ws[3]; L.words[b] = ws[2]; }
        renderWords(); Snd.glitch(); shake();
      }
      return;
    }
    fillIf(L, sentenceText(L) === L.orig.join(" "), dt, 1.2, 1);
  },
  drawTop(L) { if (S.calm && L.scrambled) { ctx.save(); ctx.globalAlpha = 0.3; drawText(L.orig.join(" "), Math.min(W / 18, 34), "#fff", W / 2, H * 0.62); ctx.restore(); } },
  async cheat(L, T) {
    await T.step(3);
    for (let i = 0; i < L.orig.length; i++) {
      const want = L.words.find((w, j) => j >= i && w.orig === L.orig[i] && !(j > i && L.words[i].orig === L.orig[i]));
      if (want && L.words[i] !== want && L.words[i].orig !== L.orig[i]) T.swap(L.words[i].id, want.id);
    }
    for (const w of L.words) T.cycleTo(w.id, w.orig);
  },
});

def({
  id: "sign", tier: 4, fam: "gesture",
  reveal: "YOUR MARK COUNTS.",
  hints: ["it needs your signature.", "the sentence says where. you write with a drag.", "drag a squiggle inside the box (and make sure the box is HERE)."],
  floatWords: ["✍", "SIGN", "X", "HERE", "THERE", "NAME"],
  words: () => [W_("SIGN"), W_(["NOWHERE", "THERE", "HERE"], { id: "w" })],
  box(L) { const w = get(L, "w"); return w === "HERE" ? { x: W / 2 - 150, y: H * 0.58, w: 300, h: 110 } : w === "THERE" ? { x: W - 320, y: 140, w: 280, h: 90 } : null; },
  setup() { scatter(14); },
  onUp(L, g) {
    const b = L.def.box(L);
    if (!b) return;
    const inside = g.path.filter((p) => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h);
    let len = 0;
    for (let i = 1; i < inside.length; i++) len += Math.hypot(inside[i].x - inside[i - 1].x, inside[i].y - inside[i - 1].y);
    if (inside.length > g.path.length * 0.7 && len > 220) { if (get(L, "w") === "HERE") L.p = 1; else popText(g.x, g.y, "NOT THERE. HERE.", "#ffb3c4", true); }
  },
  drawTop(L) {
    const b = L.def.box(L);
    if (b) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeRect(b.x, b.y, b.w, b.h); ctx.setLineDash([]); drawText("✕ ________", 22, "#fff", b.x + b.w / 2, b.y + b.h * 0.7, "VT323, monospace"); }
    drawPath("#2af0ff");
  },
  async cheat(L, T) {
    T.cycleTo("w", "HERE");
    const b = L.def.box(L);
    T.down(b.x + 20, b.y + 50);
    for (let i = 0; i < 30; i++) T.move(b.x + 20 + i * 8, b.y + 50 + Math.sin(i) * 30);
    T.up(b.x + 260, b.y + 50);
  },
});

const IRIS = { VIOLET: "#b07bff", GREEN: "#2bff88", RED: "#ff2a3d", YELLOW: "#ffe23a", BLUE: "#2f7bff", ORANGE: "#ff8a1f" };
def({
  id: "eyecolor", tier: 4, fam: "eye",
  reveal: "YOU LOOKED THE EYE IN THE EYE.",
  hints: ["what color are its eyes?", "the eye at the bottom has a color today.", "set the color word to the color of the eye's iris at the bottom."],
  floatWords: () => Object.keys(IRIS),
  prep(L) { L.real = L.pick(Object.keys(IRIS).filter((c) => c !== "VIOLET")); },
  words: (L) => [W_("THE"), W_("EYE"), W_("IS"), W_(startAway(Object.keys(IRIS), L.real, L), { id: "c" })],
  setup(L) { document.querySelector(".m-iris").style.fill = IRIS[L.real]; scatter(20); },
  update(L, dt) { fillIf(L, get(L, "c") === L.real, dt, 1.5, 1); },
  teardown() { document.querySelector(".m-iris").style.fill = ""; },
  async cheat(L, T) { T.cycleTo("c", L.real); },
});

// ---------------- tier 5: the last layer of the day ----------------

def({
  id: "about", tier: 5, fam: "final",
  reveal: "YOU UNDERSTOOD.",
  hints: ["what have you been doing this whole time?", "you never really followed the instructions. you did something else with them.", "it's about the words. or about understanding. or about changing the rules."],
  floatWords: ["ABOUT?", "WHAT IS IT ABOUT", "DICE", "CATS", "YOU", "THIS", "IT'S ABOUT TIME", "?", "ALMOST", "THE END?"],
  taunts: { DICE: "wrong game.", CATS: "meow? no.", COLORS: "closer than you think. no.", CLICKING: "you clicked a lot. that's not it.",
    NOTHING: "nothing is something. still no.", CHAOS: "the chaos is just the wrapping paper.", YOU: "flattering. no.",
    LIES: "some of them, yes. but no.", WINNING: "you never won. you understood.", EVERYTHING: "too easy." },
  words: () => [W_("THIS"), W_(["GAME", "THING", "PAGE"]), W_("IS"), W_("ABOUT"),
    W_(["DICE", "CATS", "COLORS", "CLICKING", "NOTHING", "CHAOS", "YOU", "LIES", "WINNING", "WORDS", "UNDERSTANDING", "CHANGING THE RULES", "EVERYTHING"], { id: "x" })],
  setup() { S.boost = 0.8; scatter(34); },
  update(L, dt) {
    const x = get(L, "x");
    fillIf(L, ["WORDS", "UNDERSTANDING", "CHANGING THE RULES"].includes(x), dt, 2.5, 1);
    if (L.tauntT > 0) { L.tauntT -= dt; if (L.tauntT <= 0 && L.def.taunts[x]) popText(W / 2, barBottom() + 36, L.def.taunts[x], "#e3d4ff", true); }
  },
  onWord(L, w) { if (w.id === "x") L.tauntT = 0.9; },
  async cheat(L, T) { T.cycleTo("x", "UNDERSTANDING"); },
});

def({
  id: "endhere", tier: 5, fam: "final",
  reveal: "THE END WAS ALWAYS ONE WORD AWAY.",
  hints: ["where is the end?", "one small word stands between you and the end.", "get rid of NOT (or make it NOT A LIE)."],
  floatWords: ["THE END", "FIN", "NOT YET", "ALMOST", "HERE?", "∎"],
  words: () => [W_("THE"), W_("END"), W_("IS"), W_("NOT", { id: "not", heavy: true, removable: true }), W_(["HERE", "NEAR", "THERE", "A LIE"], { id: "w" })],
  setup() { S.boost = 0.6; scatter(30); },
  update(L, dt) { const s = sentenceText(L); fillIf(L, s === "THE END IS HERE" || s === "THE END IS NOT A LIE", dt, 2, 1); },
  async cheat(L, T) { T.remove("not"); },
});

def({
  id: "wakeup", tier: 5, fam: "final",
  reveal: "YOU WERE DREAMING. YOU WOKE UP.",
  hints: ["everything is so slow.", "dreams end when you shake them. or when you sleep deeper.", "tap very fast, many times (or change it to SLEEP and stay still)."],
  floatWords: ["zzz", "WAKE UP", "WAKE UP!", "five more minutes", "DREAM", "☁"],
  words: () => [W_(["WAKE UP", "SLEEP", "DREAM ON"], { id: "w" })],
  setup(L) { L.taps = []; L.start = now(); S.worldSpeed = 0.3; veilEl.className = "veil veil-closed"; scatter(30); },
  update(L) {
    const w = get(L, "w");
    if (w === "WAKE UP") { L.taps = L.taps.filter((t) => now() - t < 4); L.p = L.taps.length / 15; }
    else if (w === "SLEEP") L.p = (now() - Math.max(S.lastInput, S.lastMove, L.start)) / 6;
    else L.p = 0;
  },
  onWord(L) { L.start = now(); },
  onTap(L) { L.taps.push(now()); },
  async cheat(L, T) { for (let i = 0; i < 16; i++) { T.tap(W * 0.3, H * 0.7); await T.step(0.1); } },
});

const WIN_WORDS = ["WIN", "WON", "END", "UNDERSTAND", "FREE", "DONE", "EXIT", "FINISH", "SOLVED", "LEAVE", "WAKE"];
def({
  id: "rewrite", tier: 5, fam: "final",
  reveal: "YOU WROTE THE LAST RULE YOURSELF.",
  hints: ["who writes the rules?", "every word here can be rewritten. tap one.", "write a rule in which you win, end or understand."],
  floatWords: ["WRITE", "RULE", "YOURS", "✎", "ANYTHING", "?"],
  words: () => ["REWRITE", "THE", "LAST", "RULE"].map((t) => W_(t, { editable: true })),
  answers: () => WIN_WORDS,
  setup() { scatter(26); },
  onType(L, v) { if (WIN_WORDS.some((x) => v.split(/[^A-Z]+/).some((p) => p.startsWith(x)))) L.p = 1; },
  onWord(L) { L.def.onType(L, sentenceText(L)); },
  async cheat(L, T) { T.edit(2, "I WIN"); },
});

def({
  id: "whoplays", tier: 5, fam: "final",
  reveal: "YOU WERE PLAYING IT. NOT THE OTHER WAY ROUND.",
  hints: ["who is playing whom?", "turn the sentence around. one small word has to change too.", "make it say YOU ARE PLAYING THE GAME."],
  floatWords: ["WHO?", "PLAYER", "GAME", "↔", "PUPPET", "STRINGS"],
  words: () => [W_("THE", { id: "a" }), W_("GAME", { id: "b" }), W_(["IS", "ARE", "WAS"], { id: "c" }), W_("PLAYING", { id: "d" }), W_("YOU", { id: "e" })],
  setup() { S.boost = 0.6; scatter(28); },
  update(L, dt) { fillIf(L, sentenceText(L) === "YOU ARE PLAYING THE GAME", dt, 1.5, 1); },
  async cheat(L, T) {
    const want = ["e", "c", "d", "a", "b"];
    for (let i = 0; i < want.length; i++) if (L.words[i].id !== want[i]) T.swap(L.words[i].id, want[i]);
    T.cycleTo("c", "ARE");
  },
});

def({
  id: "backwards", tier: 5, fam: "final",
  reveal: "READ IN A MIRROR, IT WAS YOUR NAME FOR IT.",
  hints: ["it reads strangely.", "every word is spelled backwards. so is the order.", "swap the words so that, read from the right, it makes sense: MY NAME IS MYSTERLE."],
  floatWords: ["ꟻ", "ƎЯ", "MIRROR", "ELRETSYM", "←", "ƧI"],
  words: (L) => L.shuffle(["MY", "NAME", "IS", "MYSTERLE"]).map((t) => W_(t, { id: t, display: (w) => wtext(w).split("").reverse().join("") })),
  setup(L) {
    if (sentenceText(L) === "MYSTERLE IS NAME MY") { [L.words[0], L.words[1]] = [L.words[1], L.words[0]]; }
    scatter(28);
  },
  update(L, dt) { fillIf(L, sentenceText(L) === "MYSTERLE IS NAME MY", dt, 1.5, 1); },
  async cheat(L, T) {
    const want = ["MYSTERLE", "IS", "NAME", "MY"];
    for (let i = 0; i < want.length; i++) if (L.words[i].id !== want[i]) T.swap(L.words[i].id, want[i]);
  },
});

def({
  id: "brand", tier: 5, fam: "final",
  reveal: "THE BEGINNING WAS THE WAY OUT.",
  hints: ["where did it all start?", "the start is still written up in the corner.", "tap the word MYSTERLE in the top left."],
  floatWords: ["START", "BEGIN", "↖", "BACK", "AGAIN", "#1"],
  words: () => [W_("GO"), W_(["BACK", "FORWARD"], { id: "d" }), W_("TO"), W_("THE"), W_(["START", "END"], { id: "e" })],
  setup() { S.boost = 0.6; scatter(28); },
  onBrand(L) {
    if (get(L, "d") === "BACK" && get(L, "e") === "START") L.p = 1;
    else whisper("there is no end. not that way.", 3);
  },
  async cheat(L, T) { T.tool("brand"); },
});

def({
  id: "nothing", tier: 5, fam: "final",
  reveal: "AND THEN THERE WAS NOTHING. AND IT WAS ENOUGH.",
  hints: ["less.", "less than that.", "don't click, don't type, don't even move. for a while."],
  floatWords: ["...", "NOTHING", "ANYTHING?", "STILL", "SHH", "∅"],
  words: () => ["SAY", "NOTHING.", "DO", "NOTHING.", "BE", "NOTHING."].map((t) => W_(t, { heavy: true, removable: true })),
  setup(L) { L.start = now(); S.boost = 0.6; scatter(30); },
  update(L) {
    const still = now() - Math.max(S.lastInput, S.lastMove, L.start);
    L.p = still / (L.words.length ? 8 : 3);
    S.calmProx = clamp(L.p, 0, 1) * 0.9;
  },
  async cheat(L, T) { await T.step(9); },
});

def({
  id: "trust", tier: 5, fam: "final",
  reveal: "THE EYE LIED. YOU DIDN'T NEED IT.",
  hints: ["the eye is lying to you.", "do what the words say, whatever the eye shows.", "tap six circles. ignore the eye at the bottom."],
  floatWords: ["LIAR", "👁", "TRUST", "DON'T", "ALMOST", "WRONG"],
  words: () => ["TAP", "SIX", "CIRCLES.", "DON'T", "TRUST", "THE", "EYE."].map((t) => W_(t)),
  setup(L) { L.n = 0; L.fake = 0; scatter(30); for (let i = 0; i < 6; i++) objs.push(mk("circle", pick(COLOR_KEYS))); },
  update(L, dt) {
    L.fake = clamp(L.fake - dt * 0.15, 0, 1);
    L.p = L.n / 6;
    L.showP = L.fake;
  },
  onTap(L, x, y) {
    const o = hitObj(x, y);
    if (!o) return;
    if (o.shape === "circle") { L.n++; popObj(o); objs.push(mk("circle", pick(COLOR_KEYS), { alpha: 0 })); L.fake = Math.max(0, L.fake - 0.3); Snd.bad(); }
    else { L.fake = Math.min(0.95, L.fake + 0.25); Snd.good(); o.spin = 10; }
  },
  async cheat(L, T) { for (let i = 0; i < 6; i++) T.tapWorld(objs.filter((o) => o.shape === "circle").slice(-1)[0]); },
});

def({
  id: "understand", tier: 5, fam: "final",
  reveal: "YES. YOU DO.",
  hints: ["be honest.", "if you say yes, it will ask for proof.", "answer YES, then do exactly what it asks."],
  floatWords: ["YES", "NO", "MAYBE", "?", "SURE?", "PROVE IT"],
  words: () => [W_("DO"), W_("YOU"), W_("UNDERSTAND"), W_(["NO", "MAYBE", "ALMOST", "YES"], { id: "a" }), W_("?")],
  setup(L) { L.proof = false; S.boost = 0.6; scatter(30); },
  onWord(L, w) {
    if (w.id === "a" && wtext(w) === "YES" && !L.proof) {
      L.proof = true; L.start = now();
      L.words = "THEN PROVE IT: DO NOTHING.".split(" ").map((t) => W_(t));
      renderWords(true); Snd.glitch();
    } else if (w.id === "a" && wtext(w) === "NO") whisper("honest. keep going.", 2);
  },
  update(L) { if (L.proof) L.p = (now() - Math.max(S.lastInput, L.start)) / 5; },
  async cheat(L, T) { T.cycleTo("a", "YES"); await T.step(6); },
});
