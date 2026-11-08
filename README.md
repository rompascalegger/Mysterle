# Mysterle

Too much is happening and nobody knows why. The game is to understand the game.

Plain HTML, CSS and JavaScript, no build step, no dependencies (same setup as Dicele).

**A new mystery every day.** The date picks 12 of the 100 layers, in rising difficulty
(3 × tier 1, 3 × tier 2, 3 × tier 3, 2 × tier 4, 1 ending), never two of the same kind.
It also rolls each layer's details (numbers, words, colors, positions, secret words) and
3 daily anomalies (double vision, ghost cursors, a voice, fake endings, screen tears, …),
plus a name like *THE MOTH-EATEN GARDEN*. Everyone gets the same mystery on the same day.

- One attempt per day. Closing the tab is fine: the run (layer, time, clicks, hints) is saved and continues where you left it.
- After solving it: share the result, or descend into **the abyss**, which goes through all 100 layers (unranked).
- The **codex** (▦) collects every rule you have understood, x / 100.

Buttons: ? hint (counts against you), ▦ codex, ☾ calm mode (less flashing and motion; some layers reveal things in calm mode), ♪ sound.

## Files

| File | What it is |
|---|---|
| `index.html` | Page structure |
| `style.css` | Look and all CSS animations |
| `script.js` | Engine: daily selection, sentence words (tap, drag, remove, type, letters), input, chaos, anomalies, sound, save, codex, test harness |
| `layers-1.js` … `layers-4.js` | The 100 layers (tier 1 → tier 5), each registered with `def({...})` |

## Writing a layer

```js
def({
  id: "door", tier: 1, fam: "world",           // fam: never two of the same family in one day
  reveal: "SAYING IT MAKES IT SO.",            // shown when solved, stored in the codex
  hints: ["cryptic", "clearer", "plain"],      // whispered at 35 s / 80 s / 140 s, or via ?
  words: (L) => [W_("THE"), W_(["DOOR", "SKY"], { id: "n" }), ...],
  setup(L) { /* objects, using L.rng / L.pick / L.int for daily variation */ },
  update(L, dt) { /* set L.p from 0 to 1; at 1 the layer is solved */ },
  onTap(L, x, y) {}, onWord(L, w) {}, onKey(L, e) {}, answers: (L) => ["WORD"], ...
  async cheat(L, T) { /* solve it the intended way, for the test harness */ },
});
```

## Testing

Every layer has a `cheat()` that plays it the intended way. In the browser console:

```js
await __testAll()          // plays all 100 layers, returns the ones that did not solve
await __testAll("other")   // same with other random details
```

## Run locally

```bash
python -m http.server 8124
```
