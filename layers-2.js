"use strict";
// Layers, tier 2: the sentence starts fighting back.

def({
  id: "catchfast", tier: 2, fam: "target",
  reveal: "SPEED IS AN ADJECTIVE.",
  hints: ["too fast for you?", "the sentence describes how it moves.", "change FAST to STILL, then catch it."],
  floatWords: ["FAST", "FASTER", "ZOOM", "CATCH", "MISSED", "TOO SLOW"],
  words: () => [W_("CATCH"), W_("THE"), W_(["FAST", "SLOW", "STILL", "SLEEPING", "FASTER"], { id: "a" }), W_("ONE")],
  setup(L) {
    L.gold = mk("star", "YELLOW", { r: 16, base: 950, flee: 220, noDamp: false, vr: 8 });
    objs.push(L.gold);
    scatter(20);
  },
  update(L) {
    const a = get(L, "a");
    L.gold.speedMul = ({ FAST: 1, SLOW: 0.15, STILL: 0, SLEEPING: 0, FASTER: 1.8 })[a];
    L.gold.hidden = a === "SLEEPING";
  },
  onTap(L, x, y) { if (hitObj(x, y, (o) => o === L.gold)) L.p = 1; },
  async cheat(L, T) { T.cycleTo("a", "STILL"); await T.step(0.1); T.tapWorld(L.gold); },
});

def({
  id: "invisible", tier: 2, fam: "target",
  reveal: "SEEING IS A SETTING.",
  hints: ["it is there. you just can't see it.", "invisible is a word. words change.", "make it VISIBLE (or GLOWING), then click it."],
  floatWords: ["WHERE?", "HERE", "THERE", "NOWHERE", "👻", "INVISIBLE"],
  prep(L) { L.shape = L.pick(["SQUARE", "CIRCLE", "TRIANGLE", "STAR"]); },
  words: (L) => [W_("CLICK"), W_("THE"), W_(["INVISIBLE", "VISIBLE", "GLOWING", "ENORMOUS"], { id: "a" }), W_(L.shape, { heavy: true })],
  setup(L) {
    const sh = ({ SQUARE: "square", CIRCLE: "circle", TRIANGLE: "tri", STAR: "star" })[L.shape];
    L.ghost = mk(sh, "WHITE", { color: "#ffffff", r: 18, base: 60, alpha: 0, keepAlpha: true });
    objs.push(L.ghost);
    scatter(26);
  },
  update(L) {
    const a = get(L, "a");
    L.ghost.alpha = a === "VISIBLE" || a === "GLOWING" ? 1 : 0;
    L.ghost.scale = a === "ENORMOUS" ? 3 : 1;
    if (a === "GLOWING" && Math.random() < 0.15) rings.push({ x: toScreen(L.ghost.x, L.ghost.y).x, y: toScreen(L.ghost.x, L.ghost.y).y, r: 10, v: 120, life: 0.5, max: 0.5, col: "255,255,255", w: 2 });
  },
  onTap(L, x, y) { if (hitObj(x, y, (o) => o === L.ghost)) L.p = 1; },
  async cheat(L, T) { T.cycleTo("a", "VISIBLE"); T.tapWorld(L.ghost); },
});

def({
  id: "pop30", tier: 2, fam: "time",
  reveal: "DEADLINES ARE WRITTEN BY SOMEONE. NOW BY YOU.",
  hints: ["that's impossible. as written.", "every number and unit in the sentence can change.", "ask for fewer bubbles or more time."],
  floatWords: ["POP", "POP!", "FASTER", "TOO SLOW", "TIME'S UP", "🫧"],
  words: () => [W_("POP"), W_(["THIRTY", "FORTY", "TWENTY", "THREE", "ONE"], { id: "n" }), W_("BUBBLES"), W_("IN"),
    W_(["TEN", "FIVE", "TWO", "SIXTY"], { id: "t" }), W_(["SECONDS", "MINUTES", "HOURS"], { id: "u" })],
  setup(L) { L.count = 0; L.left = 10; L.spawnT = 0; },
  limit(L) { return NUMVAL[get(L, "t")] * ({ SECONDS: 1, MINUTES: 60, HOURS: 3600 })[get(L, "u")]; },
  onWord(L) { L.count = 0; L.left = L.def.limit(L); },
  update(L, dt) {
    L.spawnT -= dt;
    if (L.spawnT <= 0 && objs.length < 24) { L.spawnT = 0.35; objs.push(mk("circle", pick(COLOR_KEYS), { r: rand(16, 28), base: rand(60, 160), alpha: 0.2 })); }
    L.left -= dt;
    if (L.left <= 0) { if (L.count) popText(W / 2, H * 0.6, "TIME'S UP. " + L.count + ".", "#ff6b7d", true); L.count = 0; L.left = L.def.limit(L); }
    L.p = L.count / NUMVAL[get(L, "n")];
  },
  onTap(L, x, y) { const o = hitObj(x, y, (q) => q.shape === "circle"); if (o) { popObj(o); L.count++; Snd.good(); } },
  drawTop(L) {
    const f = clamp(L.left / L.def.limit(L), 0, 1);
    ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(W * 0.2, H - 150, W * 0.6, 6);
    ctx.fillStyle = "#ffe23a"; ctx.fillRect(W * 0.2, H - 150, W * 0.6 * f, 6);
  },
  async cheat(L, T) { T.cycleTo("n", "ONE"); await T.step(0.5); T.tapWorld(objs.find((o) => o.shape === "circle")); },
});

def({
  id: "avoid", tier: 2, fam: "chase",
  reveal: "WHAT CHASES YOU CAN BE BEFRIENDED.",
  hints: ["they want you.", "survive, or stop running. the verb decides.", "AVOID: keep away for ten seconds. TOUCH: let them catch you."],
  floatWords: ["RUN", "BEHIND YOU", "CLOSER", "HIDE", "CAUGHT", "!!"],
  words: () => [W_(["AVOID", "TOUCH", "BEFRIEND"], { id: "v" }), W_("THE"), W_(["RED", "BLUE", "EVERYTHING"], { id: "c" })],
  setup(L) {
    for (let i = 0; i < 3; i++) objs.push(mk("circle", "RED", { r: 22, base: 170, chase: 420, chaser: true }));
    scatter(12);
  },
  update(L, dt) {
    const v = get(L, "v"), c = get(L, "c"), p = toWorld(S.px, S.py);
    const touching = objs.some((o) => o.chaser && Math.hypot(o.x - p.x, o.y - p.y) < o.r + 6);
    const redNamed = c === "RED" || c === "EVERYTHING";
    if (v === "AVOID") {
      if (touching && redNamed) { if (L.p > 0.05) { popText(S.px, S.py, "CAUGHT.", "#ff6b7d"); Snd.bad(); } L.p = 0; }
      else L.p += dt / 10;
    } else if (v === "TOUCH" && redNamed) fillIf(L, touching, dt, 1.5, 0.3);
    else if (v === "BEFRIEND" && redNamed) { for (const o of objs) if (o.chaser) o.color = "PINK"; fillIf(L, touching, dt, 2.5, 0.3); }
    else L.p = Math.max(0, L.p - dt);
  },
  async cheat(L, T) {
    T.cycleTo("v", "TOUCH");
    for (let i = 0; i < 40 && S.L === L; i++) { const o = objs.find((q) => q.chaser), s = toScreen(o.x, o.y); T.move(s.x, s.y); await T.step(0.1); }
  },
});

def({
  id: "dontmove", tier: 2, fam: "still",
  reveal: "STILLNESS HAS A SHAPE.",
  hints: ["freeze.", "clicking isn't moving. moving is moving.", "keep your mouse or finger completely still for five seconds. or tell it not to STOP."],
  floatWords: ["MOVE", "MOVE!", "WIGGLE", "FREEZE", "STATUE", "🗿"],
  words: () => [W_("DON'T"), W_(["MOVE", "STOP", "BLINK", "BREATHE"], { id: "v" })],
  setup(L) { L.start = now(); L.moving = 0; scatter(28, { base: 160 }); },
  update(L, dt) {
    const v = get(L, "v");
    if (v === "MOVE") L.p = (now() - Math.max(S.lastMove, L.start)) / 5;
    else if (v === "STOP") { L.moving = now() - S.lastMove < 0.3 ? L.moving + dt : 0; L.p = L.moving / 5; }
    else L.p = Math.max(0, L.p - dt);
  },
  onWord(L, w) { L.start = now(); if (get(L, "v") === "BREATHE") whisper("please do.", 2); },
  async cheat(L, T) { await T.step(6); },
});

// shared builder: the command is in the sentence, but scrambled
function scrambleLayer(id, tier, reveal, cmds, decoys) {
  return def({
    id, tier, fam: "scramble", reveal,
    hints: ["that's not a sentence. yet.", "words can be dragged onto each other to swap places.", "put the words in order to make a command, then do what it says."],
    floatWords: ["ORDER", "SWAP", "WORD SALAD", "GRAMMAR", "↔", "WHAT?"],
    prep(L) {
      L.cmd = L.pick(cmds);
      L.target = L.cmd.text.split(" ");
      const ws = L.target.slice();
      if (decoys) ws.push(L.pick(decoys));
      let order;
      do { order = L.shuffle(ws); } while (order.slice(0, L.target.length).join(" ") === L.cmd.text);
      L.order = order;
    },
    words: (L) => L.order.map((t, i) => W_(t, { id: "w" + i, heavy: true, removable: !L.target.includes(t) })),
    setup(L) { L.start = now(); scatter(22); },
    ok(L) { return sentenceText(L) === L.cmd.text; },
    onWord(L) {
      L.start = now();
      const ok = L.def.ok(L);
      L.words.forEach((w) => (w.cls = ok ? "lit" : ""));
      if (ok) { Snd.good(); whisper("yes. now do it.", 2); }
    },
    update(L, dt) { if (L.cmd.act === "wait" && L.def.ok(L)) L.p = (now() - Math.max(S.lastInput, L.start)) / 4; },
    onTap(L) { if (L.cmd.act === "tap" && L.def.ok(L)) L.p = 1; },
    onEye(L) { if (L.cmd.act === "eye" && L.def.ok(L)) { L.eyes = (L.eyes || 0) + 1; if (L.eyes >= (L.cmd.n || 1)) L.p = 1; } },
    async cheat(L, T) {
      for (const w of L.words.slice()) if (!L.target.includes(wtext(w))) T.remove(w.id);
      for (let i = 0; i < L.target.length; i++) {
        const want = L.words.find((w, j) => j >= i && wtext(w) === L.target[i]);
        if (L.words[i] !== want) T.swap(L.words[i].id, want.id);
      }
      if (L.cmd.act === "tap") T.tap(W * 0.3, H * 0.7);
      if (L.cmd.act === "eye") for (let i = 0; i < (L.cmd.n || 1); i++) T.eye();
      if (L.cmd.act === "wait") await T.step(5);
    },
  });
}
scrambleLayer("scramble3", 2, "ORDER IS MEANING.", [
  { text: "CLICK TO WIN", act: "tap" }, { text: "TAP THE EYE", act: "eye" }, { text: "WAIT FOR IT", act: "wait" },
  { text: "TOUCH ANYWHERE NOW", act: "tap" }, { text: "POKE THE EYE", act: "eye" },
]);
scrambleLayer("scramble5", 3, "SOME WORDS ARE ONLY IN THE WAY.", [
  { text: "CLICK ANYWHERE TO WIN", act: "tap" }, { text: "WAIT A FEW SECONDS", act: "wait" },
  { text: "TAP THE EYE TWICE", act: "eye", n: 2 }, { text: "NOW TAP THE EYE", act: "eye" },
], ["NOT", "NEVER", "DON'T", "PLEASE?", "BACKWARDS"]);

def({
  id: "truthsquares", tier: 2, fam: "truth",
  reveal: "YOU CAN CHANGE THE WORDS OR THE WORLD.",
  hints: ["is that true?", "two ways to make it true: change the sentence, or change what's on the screen.", "pop every square (tap them), or count them and set the number."],
  floatWords: ["■", "□", "NONE", "ZERO", "TRUE", "FALSE"],
  prep(L) { L.counts = { squares: L.int(4, 7), circles: L.int(3, 6), tri: L.int(2, 5), star: L.int(5, 9) }; },
  words: () => [W_("THERE"), W_("ARE"), W_(["NO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "MANY"], { id: "n" }),
    W_(["SQUARES", "CIRCLES", "TRIANGLES", "STARS"], { id: "k" })],
  setup(L) {
    const c = L.counts;
    for (let i = 0; i < c.squares; i++) objs.push(mk("square", pick(COLOR_KEYS)));
    for (let i = 0; i < c.circles; i++) objs.push(mk("circle", pick(COLOR_KEYS)));
    for (let i = 0; i < c.tri; i++) objs.push(mk("tri", pick(COLOR_KEYS)));
    for (let i = 0; i < c.star; i++) objs.push(mk("star", pick(COLOR_KEYS)));
  },
  update(L, dt) {
    const sh = ({ SQUARES: "square", CIRCLES: "circle", TRIANGLES: "tri", STARS: "star" })[get(L, "k")];
    const count = objs.filter((o) => o.shape === sh).length, n = get(L, "n");
    fillIf(L, n === "MANY" ? count >= 13 : (n === "NO" ? 0 : NUMVAL[n]) === count, dt, 2, 0.8);
  },
  onTap(L, x, y) { const o = hitObj(x, y); if (o) { popObj(o); Snd.good(); } },
  async cheat(L, T) {
    for (let g = 0; g < 60 && S.L === L; g++) { const o = objs.find((q) => q.shape === "square"); if (!o) break; T.tapWorld(o); }
  },
});

def({
  id: "letters", tier: 2, fam: "self",
  reveal: "A NUMBER CAN COUNT ITSELF.",
  hints: ["count. everything.", "the number is part of what it counts.", "count the letters of the whole sentence, including the number word, and find the number that fits."],
  floatWords: ["A", "B", "C", "ABC", "COUNT", "LETTERS", "∑"],
  prep(L) {
    const variants = [["THIS", "SENTENCE", "HAS"], ["THERE", "ARE"], ["I", "AM", "MADE", "OF"], ["COUNT", "THEM:"], ["THIS", "HAS"]];
    const tails = [["LETTERS"], ["LETTERS", "HERE"], ["LETTERS", "IN", "TOTAL"]];
    const letters = (a) => a.join("").replace(/[^A-Z]/g, "").length;
    const opts = [];
    for (const v of variants) for (const t of tails) {
      const base = letters(v) + letters(t);
      const fixed = [];
      for (let n = 10; n < 60; n++) if (base + letters([numWord(n)]) === n) fixed.push(n);
      if (fixed.length) opts.push({ v, t, fixed });
    }
    L.form = L.pick(opts);
  },
  words: (L) => L.form.v.map((t) => W_(t)).concat([W_(startAway(numRange(10, 59), numWord(L.form.fixed[0]), L), { id: "n" })]).concat(L.form.t.map((t) => W_(t))),
  setup() { scatter(20); },
  update(L, dt) { fillIf(L, NUMVAL[get(L, "n")] === sentence(L).join("").replace(/[^A-Z]/g, "").length, dt, 1.5, 1); },
  async cheat(L, T) { T.cycleTo("n", numWord(L.form.fixed[0])); },
});

const SKY_COLORS = { RED: "#5a0414", BLUE: "#06266a", GREEN: "#064d22", PURPLE: "#3a0a6a", ORANGE: "#6e3200", PINK: "#6a0a4f" };
def({
  id: "skycolor", tier: 2, fam: "ink",
  reveal: "LOOK UP BEFORE YOU READ.",
  hints: ["the words around you are lying about colors.", "look past everything. what color is the background?", "set the color word to the real color of the sky behind everything."],
  floatWords: () => Object.keys(SKY_COLORS).concat(["BLUE?", "GREEN!", "COLOR", "SKY"]),
  prep(L) { L.real = L.pick(Object.keys(SKY_COLORS)); },
  words: (L) => [W_("THE"), W_("SKY"), W_("IS"), W_(startAway(Object.keys(SKY_COLORS), L.real, L), { id: "c" })],
  setup(L) { S.skyColor = SKY_COLORS[L.real]; scatter(22); },
  update(L, dt) { fillIf(L, get(L, "c") === L.real, dt, 1.5, 1); },
  async cheat(L, T) { T.cycleTo("c", L.real); },
});

def({
  id: "clicks", tier: 2, fam: "count",
  reveal: "PRECISION IS A KIND OF UNDERSTANDING.",
  hints: ["the numbers on screen are lying.", "count your own clicks. then wait, and the game checks.", "click exactly that many times, then stop and wait a few seconds."],
  floatWords: () => numRange(1, 15),
  words: (L) => [W_("CLICK"), W_("EXACTLY"), W_(L.shuffle(numRange(3, 12)), { id: "n" }), W_("TIMES")],
  setup(L) { L.count = 0; L.last = 0; scatter(20); },
  onWord(L) { L.count = 0; },
  onTap(L) { L.count++; L.last = now(); },
  update(L) {
    if (L.count && now() - L.last > 2.5) {
      if (L.count === NUMVAL[get(L, "n")]) L.p = 1;
      else { popText(W / 2, H * 0.62, "THAT WAS " + numWord(Math.min(L.count, 99)) + ".", "#ffb3c4", true); Snd.bad(); L.count = 0; }
    }
  },
  async cheat(L, T) { const n = NUMVAL[get(L, "n")]; for (let i = 0; i < n; i++) T.tap(W * 0.3, H * 0.75); await T.step(3); },
});

def({
  id: "corners", tier: 2, fam: "place",
  reveal: "THE SCREEN HAS EDGES. USE THEM.",
  hints: ["a screen is a room.", "rooms have corners.", "move (or tap) into all four corners of the screen."],
  floatWords: ["↖", "↗", "↙", "↘", "CORNER", "EDGE"],
  words: () => [W_("VISIT"), W_(["EVERY", "ONE", "NO"], { id: "q" }), W_("CORNER")],
  setup(L) { L.lit = [false, false, false, false]; scatter(22); },
  check(L, x, y) {
    const k = 80, c = [[0, 0], [W, 0], [0, H], [W, H]];
    c.forEach(([cx, cy], i) => { if (Math.abs(x - cx) < k && Math.abs(y - cy) < k && !L.lit[i]) { L.lit[i] = true; Snd.good(); } });
  },
  onMove(L, x, y) { L.def.check(L, x, y); },
  onTap(L, wx, wy, x, y) { L.def.check(L, x, y); },
  update(L) {
    const n = L.lit.filter(Boolean).length, q = get(L, "q");
    L.p = q === "EVERY" ? n / 4 : q === "ONE" ? (n ? 1 : 0) : 0;
  },
  drawTop(L) {
    const c = [[0, 0], [W, 0], [0, H], [W, H]];
    c.forEach(([x, y], i) => { if (L.lit[i]) { ctx.fillStyle = "rgba(43,255,136,.6)"; ctx.beginPath(); ctx.arc(x, y, 60, 0, 7); ctx.fill(); } });
  },
  async cheat(L, T) { for (const [x, y] of [[4, 4], [W - 4, 4], [4, H - 4], [W - 4, H - 4]]) T.move(x, y); },
});

def({
  id: "edge", tier: 2, fam: "place",
  reveal: "THE GAME ENDS WHERE THE SCREEN ENDS.",
  hints: ["can you leave?", "the sentence can be changed to something your hand can do.", "move the pointer out of the window, or make it TOUCH THE EDGE and touch the very edge."],
  floatWords: ["EXIT", "OUT", "BEYOND", "→", "←", "EDGE"],
  words: () => [W_(["LEAVE", "TOUCH", "HUG"], { id: "v" }), W_("THE"), W_(["SCREEN", "EDGE", "WORDS"], { id: "o" })],
  setup() { scatter(22); },
  onLeave(L) { if (get(L, "v") === "LEAVE" && get(L, "o") === "SCREEN") L.p = 1; },
  check(L, x, y) { if (get(L, "v") === "TOUCH" && get(L, "o") === "EDGE" && (x < 8 || y < 8 || x > W - 8 || y > H - 8)) L.p = 1; },
  onMove(L, x, y) { L.def.check(L, x, y); },
  onTap(L, wx, wy, x, y) { L.def.check(L, x, y); },
  async cheat(L, T) { T.cycleTo("v", "TOUCH"); T.cycleTo("o", "EDGE"); T.move(3, H / 2); },
});

def({
  id: "center", tier: 2, fam: "place",
  reveal: "THE MIDDLE IS NOT WHERE IT SAYS.",
  hints: ["the cross is lying.", "find the true middle of your screen, not the marked one.", "rest your pointer exactly in the center of the screen for two seconds."],
  floatWords: ["+", "✛", "HERE", "MIDDLE", "CENTER", "NOT HERE"],
  prep(L) { L.off = { x: L.pick([-1, 1]) * L.int(50, 110), y: L.pick([-1, 1]) * L.int(40, 90) }; },
  words: () => [W_("FIND"), W_("THE"), W_(["MIDDLE", "CENTER", "EDGE"], { id: "w" })],
  setup(L) { L.held = 0; scatter(18); },
  update(L, dt) {
    const w = get(L, "w"), d = Math.hypot(S.px - W / 2, S.py - H / 2);
    const ok = w === "EDGE" ? S.px < 10 || S.py < 10 || S.px > W - 10 || S.py > H - 10 : d < 18;
    L.held = ok ? L.held + dt : 0;
    L.p = L.held / 2;
  },
  drawTop(L) {
    const x = W / 2 + L.off.x, y = H / 2 + L.off.y;
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 18, y); ctx.lineTo(x + 18, y); ctx.moveTo(x, y - 18); ctx.lineTo(x, y + 18); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.stroke();
  },
  async cheat(L, T) { T.move(W / 2, H / 2); await T.step(2.5); },
});

function gestureCircle(path) {
  if (path.length < 12) return false;
  const cx = path.reduce((s, p) => s + p.x, 0) / path.length, cy = path.reduce((s, p) => s + p.y, 0) / path.length;
  let sweep = 0, rs = 0;
  for (let i = 1; i < path.length; i++) {
    let d = Math.atan2(path[i].y - cy, path[i].x - cx) - Math.atan2(path[i - 1].y - cy, path[i - 1].x - cx);
    if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    sweep += d; rs += Math.hypot(path[i].x - cx, path[i].y - cy);
  }
  return Math.abs(sweep) > Math.PI * 1.75 && rs / path.length > 35;
}
function gestureLine(path) {
  if (path.length < 2) return false;
  let len = 0;
  for (let i = 1; i < path.length; i++) len += Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
  const d = Math.hypot(path[path.length - 1].x - path[0].x, path[path.length - 1].y - path[0].y);
  return d > Math.min(W, H) * 0.4 && d / len > 0.9;
}
function drawPath(color = "#ffe23a") {
  if (!S.down || S.down.path.length < 2) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.shadowColor = color; ctx.shadowBlur = 12;
  ctx.beginPath(); S.down.path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); ctx.restore();
}
def({
  id: "circle", tier: 2, fam: "gesture",
  reveal: "YOUR HAND CAN WRITE RULES TOO.",
  hints: ["draw?", "press, hold and move. you leave a trail.", "drag a big circle on the screen in one stroke (or a long straight LINE)."],
  floatWords: ["○", "◯", "DRAW", "ROUND", "SHAPE", "✎"],
  words: () => [W_("DRAW"), W_("A"), W_(["CIRCLE", "LINE", "BLANK"], { id: "s" })],
  setup() { scatter(18); },
  onUp(L, g) {
    const s = get(L, "s");
    if ((s === "CIRCLE" && gestureCircle(g.path)) || (s === "LINE" && gestureLine(g.path))) L.p = 1;
    else if (g.path.length > 8) { popText(g.x, g.y, "NOT A " + s + ".", "#ffb3c4"); Snd.bad(); }
  },
  drawTop() { drawPath(); },
  async cheat(L, T) {
    const cx = W / 2, cy = H * 0.6, r = 90;
    T.down(cx + r, cy);
    for (let a = 0; a <= Math.PI * 2.1; a += 0.15) T.move(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    T.up(cx + r, cy);
  },
});

def({
  id: "orbit", tier: 2, fam: "gesture",
  reveal: "THE EYE LIKES ATTENTION.",
  hints: ["the eye at the bottom is lonely.", "go around it. not once.", "move your pointer in circles around the eye at the bottom, as many times as the sentence says."],
  floatWords: ["↻", "AROUND", "AGAIN", "DIZZY", "ORBIT", "👁"],
  words: (L) => [W_("CIRCLE"), W_("THE"), W_("EYE"), W_(startAway(["THREE", "TWO", "ONE", "SEVEN", "TEN"], "", L), { id: "n" }), W_("TIMES")],
  setup(L) { L.angle = 0; L.lastA = null; scatter(18); },
  onWord(L) { L.angle = 0; },
  onMove(L, x, y) {
    const m = meterCenter();
    if (Math.hypot(x - m.x, y - m.y) > 300) { L.lastA = null; return; }
    const a = Math.atan2(y - m.y, x - m.x);
    if (L.lastA != null) { let d = a - L.lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; L.angle += d; }
    L.lastA = a;
  },
  update(L) { L.p = Math.abs(L.angle) / (Math.PI * 2) / NUMVAL[get(L, "n")]; },
  async cheat(L, T) {
    T.cycleTo("n", "ONE");
    const m = meterCenter();
    for (let a = 0; a <= Math.PI * 2.3; a += 0.2) T.move(m.x + Math.cos(a) * 90, m.y + Math.sin(a) * 90);
  },
});

def({
  id: "every", tier: 2, fam: "rhythm",
  reveal: "A STEADY HAND IS A CLOCK.",
  hints: ["tick. tock.", "the rhythm is in the sentence.", "tap at an even pace, once per second (or whatever interval the sentence says), several times in a row."],
  floatWords: ["TICK", "TOCK", "1", "2", "3", "⏱"],
  words: () => [W_("CLICK"), W_("EVERY"), W_(["SECOND", "OTHER SECOND", "HALF SECOND"], { id: "u" })],
  setup(L) { L.last = null; L.streak = 0; scatter(18); },
  onWord(L) { L.streak = 0; L.last = null; },
  onTap(L) {
    const want = ({ SECOND: 1, "OTHER SECOND": 2, "HALF SECOND": 0.5 })[get(L, "u")];
    if (L.last != null) {
      const gap = now() - L.last;
      if (Math.abs(gap - want) < want * 0.2) { L.streak++; Snd.good(); } else { L.streak = 0; popText(S.px, S.py, gap < want ? "TOO SOON" : "TOO LATE", "#ffb3c4"); }
    }
    L.last = now();
    L.p = L.streak / 6;
  },
  async cheat(L, T) { for (let i = 0; i < 8 && S.L === L; i++) { T.tap(W * 0.3, H * 0.7); await T.step(1); } },
});

def({
  id: "hold", tier: 2, fam: "hold",
  reveal: "PATIENCE IS A GRIP.",
  hints: ["don't let go.", "press down anywhere and keep pressing, whatever happens.", "press and hold anywhere on the screen for five seconds."],
  floatWords: ["LET GO", "RELEASE", "HOLD", "STEADY", "!!!", "CRAMP"],
  words: () => [W_(["HOLD", "LET"], { id: "v" }), W_(["ON", "GO"], { id: "p" })],
  setup(L) { L.held = 0; scatter(18); },
  update(L, dt) {
    if (get(L, "v") === "HOLD" && get(L, "p") === "ON" && S.down) {
      L.held += dt;
      if (Math.random() < dt * 1.5) spawnFloater("btn", rand(10, 80), rand(20, 80), pick(["LET GO", "RELEASE", "STOP"]));
    } else L.held = 0;
    L.p = L.held / 5;
  },
  async cheat(L, T) { await T.hold(W * 0.4, H * 0.7, 6); },
});

def({
  id: "lookeye", tier: 2, fam: "eye",
  reveal: "THE EYE WAS ALWAYS PART OF IT.",
  hints: ["which eye?", "the one at the bottom. the one that's been watching you.", "tap the eye at the bottom several times."],
  floatWords: ["👁", "LOOK", "HERE", "DOWN", "BLINK", "STARE"],
  words: () => [W_("LOOK"), W_("ME"), W_("IN"), W_("THE"), W_("EYE")],
  setup(L) { L.pokes = 0; scatter(22); },
  onEye(L) { L.pokes++; blinkMeter(); Snd.tone(500 + L.pokes * 80, 0.1, "sine", 0.1); L.p = L.pokes / 5; },
  update(L, dt) {
    const m = meterCenter();
    if (Math.hypot(S.px - m.x, S.py - m.y) < m.r && now() - S.lastMove < 4) L.p = Math.min(1, L.p + dt / 3);
  },
  async cheat(L, T) { for (let i = 0; i < 5; i++) T.eye(); },
});

def({
  id: "smallprint", tier: 2, fam: "decoy",
  reveal: "THE QUIET VOICE WAS RIGHT.",
  hints: ["the big words are loud. are they right?", "read everything on the screen. even the tiny things.", "the small text near the bottom tells you what to really tap."],
  floatWords: ["READ", "SMALL", "FINE PRINT", "BIG", "LOUD", "*"],
  prep(L) {
    const sh = L.shuffle(["SQUARE", "CIRCLE", "TRIANGLE", "STAR"]), cs = L.shuffle(COLOR_KEYS);
    L.fake = { c: cs[0], s: sh[0] }; L.real = { c: cs[1], s: sh[1] };
  },
  words: (L) => [W_("TAP"), W_("THE"), W_(L.shuffle(COLOR_KEYS), { id: "c" }), W_(["SQUARE", "CIRCLE", "TRIANGLE", "STAR"], { id: "s" })],
  setup(L) {
    setWordTo(wordById(L, "c"), L.fake.c); setWordTo(wordById(L, "s"), L.fake.s);
    const sh = (s) => ({ SQUARE: "square", CIRCLE: "circle", TRIANGLE: "tri", STAR: "star" })[s];
    L.target = mk(sh(L.real.s), L.real.c, { r: 22, base: 60 }); objs.push(L.target);
    objs.push(mk(sh(L.fake.s), L.fake.c, { r: 22, base: 60 }));
    scatter(20);
    setSmall(`* terms: ignore the big words. tap the ${L.real.c.toLowerCase()} ${L.real.s.toLowerCase()}.`);
  },
  onTap(L, x, y) {
    if (hitObj(x, y, (o) => o === L.target)) { L.p = 1; return; }
    const o = hitObj(x, y);
    if (o && o.color === get(L, "c")) popText(S.px, S.py, "THE BIG PRINT LIES.", "#ffb3c4");
  },
  async cheat(L, T) { T.tapWorld(L.target); },
});

def({
  id: "slots", tier: 2, fam: "spin",
  reveal: "LUCK IS A DECISION.",
  hints: ["everything is spinning.", "tap a spinning word to stop it. tap again to spin. (calm mode slows the wheels.)", "stop the wheels on YOU WIN NOW."],
  floatWords: ["JACKPOT", "777", "🍒", "SPIN", "STOP", "YOU WIN NOW"],
  words: (L) => [
    W_(L.shuffle(["YOU", "I", "WE", "THEY", "IT", "NOBODY"]), { id: "a", spin: true, spinRate: 0.11, onTap(_, w) { w.spin = !w.spin; } }),
    W_(L.shuffle(["WIN", "LOSE", "WAIT", "SLEEP", "BLINK", "FALL"]), { id: "b", spin: true, spinRate: 0.09, onTap(_, w) { w.spin = !w.spin; } }),
    W_(L.shuffle(["NOW", "NEVER", "LATER", "AGAIN", "SOON", "TODAY"]), { id: "c", spin: true, spinRate: 0.13, onTap(_, w) { w.spin = !w.spin; } }),
  ],
  setup() { scatter(18); },
  update(L, dt) { fillIf(L, L.words.every((w) => !w.spin) && ["YOU WIN NOW", "WE WIN NOW"].includes(sentenceText(L)), dt, 1, 1); },
  async cheat(L, T) { for (const [id, t] of [["a", "YOU"], ["b", "WIN"], ["c", "NOW"]]) { const w = T.word(id); w.spin = false; setWordTo(w, t); paintWord(w); } },
});

def({
  id: "reverse", tier: 2, fam: "type",
  reveal: "BACKWARDS IS ALSO A DIRECTION.",
  hints: ["that word looks wrong.", "it wants the word written the other way round.", "type the word backwards (letters in reverse order)."],
  floatWords: ["ESREVER", "SDRAWKCAB", "←", "TYPE", "ꟻ", "MIRROR"],
  prep(L) { L.word = L.pick(["LANTERN", "VELVET", "MIRROR", "GARDEN", "PUZZLE", "SILENCE", "CANDLE", "RIDDLE", "PLANET", "WINDOW"]); },
  words: (L) => [W_("TYPE", { editable: true }), W_(L.word, { editable: true }), W_("BACKWARDS", { editable: true })],
  answers: (L) => [L.word.split("").reverse().join("")],
  setup() { scatter(20); },
  async cheat(L, T) { T.type(L.word.split("").reverse().join("").toLowerCase()); },
});

def({
  id: "complete", tier: 2, fam: "fill",
  reveal: "THE MISSING WORD WAS FLOATING BY.",
  hints: ["the sentence is missing something.", "some floating buttons carry words. catch the right one.", "tap a floating button whose word makes the sentence true about this game."],
  fakeRate: 0.55,
  words: () => [W_("THIS"), W_("GAME"), W_("IS"), W_("______", { id: "x" })],
  floatWords: () => ["CONFUSING", "WEIRD", "LOUD", "BANANA", "TUESDAY", "PURPLE", "ASLEEP", "SOUP", "GENTLE", "TOO MUCH", "BORING", "A CHAIR"],
  good: ["CONFUSING", "WEIRD", "LOUD", "TOO MUCH"],
  setup() { scatter(14); },
  onFake(L, text) {
    const t = cleanText(text);
    if (!L.def.floatWords().includes(t)) return false;
    setWordTo(wordById(L, "x"), t); S.changes++; renderWords(); Snd.cycle();
    if (L.def.good.includes(t)) L.p = 1; else whisper(pick(["no, it isn't.", "that's not true.", "try another."]), 2);
    return true;
  },
  async cheat(L, T) { L.def.onFake(L, "CONFUSING"); },
});

def({
  id: "herd", tier: 2, fam: "herd",
  reveal: "EVEN FEAR CAN BE STEERED.",
  hints: ["they run from you.", "use that. push them.", "chase everything into the corner named in the sentence (most of it is enough)."],
  floatWords: ["SHOO", "BAA", "HERD", "CORNER", "RUN", "🐑"],
  words: (L) => [W_("GATHER"), W_("EVERYTHING"), W_(L.shuffle(["TOP LEFT", "TOP RIGHT", "BOTTOM LEFT", "BOTTOM RIGHT"]), { id: "c" })],
  zone(L) {
    const c = get(L, "c");
    return { x0: c.includes("LEFT") ? 0 : W * 0.62, y0: c.includes("TOP") ? 0 : H * 0.62, x1: c.includes("LEFT") ? W * 0.38 : W, y1: c.includes("TOP") ? H * 0.38 : H };
  },
  setup(L) { for (let i = 0; i < 10; i++) objs.push(mk("circle", "WHITE", { color: "#f3ecff", r: 14, base: 40, flee: 170, fleeForce: 1700, sheep: true })); },
  update(L, dt) {
    const z = L.def.zone(L), sheep = objs.filter((o) => o.sheep);
    const inside = sheep.filter((o) => o.x >= z.x0 && o.x <= z.x1 && o.y >= z.y0 && o.y <= z.y1).length;
    fillIf(L, inside >= Math.ceil(sheep.length * 0.8), dt, 1, 0.6);
  },
  drawWorld(L) { const z = L.def.zone(L); ctx.fillStyle = "rgba(43,255,136,.12)"; ctx.fillRect(z.x0, z.y0, z.x1 - z.x0, z.y1 - z.y0); },
  async cheat(L, T) {
    // herd by sweeping from the far side towards the zone
    const z = L.def.zone(L), tx = (z.x0 + z.x1) / 2, ty = (z.y0 + z.y1) / 2;
    for (let round = 0; round < 60 && S.L === L; round++) {
      for (const o of objs.filter((q) => q.sheep)) {
        if (o.x >= z.x0 && o.x <= z.x1 && o.y >= z.y0 && o.y <= z.y1) continue;
        const dx = o.x - tx, dy = o.y - ty, d = Math.hypot(dx, dy) || 1;
        const s = toScreen(o.x + (dx / d) * 60, o.y + (dy / d) * 60); T.move(s.x, s.y); await T.step(0.05);
      }
    }
  },
});

def({
  id: "simonsays", tier: 2, fam: "obey",
  reveal: "ONLY SOME VOICES COUNT.",
  hints: ["who is giving the orders?", "only obey when the right name comes first.", "tap only when the sentence starts with SIMON SAYS. otherwise do nothing."],
  floatWords: ["SIMON", "SAYS", "TAP", "DON'T", "OBEY", "WHO?"],
  words: () => [W_("TAP")],
  setup(L) { L.streak = 0; L.next = 0; L.cmd = null; scatter(14); },
  newCmd(L) {
    L.cmd = { simon: Math.random() < 0.55, until: now() + 2.4, done: false };
    L.words = (L.cmd.simon ? [W_("SIMON"), W_("SAYS:")] : []).concat([W_("TAP")]);
    renderWords();
  },
  update(L) {
    if (!L.cmd || now() > L.cmd.until) {
      if (L.cmd && !L.cmd.done) { if (L.cmd.simon) { L.streak = 0; popText(W / 2, H * 0.6, "TOO SLOW.", "#ffb3c4", true); } else L.streak++; }
      L.def.newCmd(L);
    }
    L.p = L.streak / 5;
  },
  onTap(L) {
    if (!L.cmd || L.cmd.done) return;
    L.cmd.done = true;
    if (L.cmd.simon) { L.streak++; Snd.good(); } else { L.streak = 0; Snd.bad(); popText(S.px, S.py, "SIMON DIDN'T SAY.", "#ffb3c4", true); }
    L.cmd.until = now() + 0.4;
  },
  async cheat(L, T) {
    for (let i = 0; i < 40 && S.L === L; i++) {
      if (L.cmd && L.cmd.simon && !L.cmd.done) T.tap(W * 0.3, H * 0.7);
      await T.step(0.3);
    }
  },
});
