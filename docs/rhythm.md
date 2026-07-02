# The notebook rhythm system

The site's background is a graph-paper lattice, and the typography is locked to
it: every line of body text sits on the ruled lines like handwriting on an
engineering pad, and every framed block (figures, code shells, tables,
callouts) sits with its border exactly on a lattice line. This document
explains how that works, the invariants that keep it true, and the rules for
touching anything vertical.

## The one number

Everything derives from a single token in `src/styles/global.css`:

```css
--cell: 30px;         /* one lattice cell */
--rhythm-phase: 7px;  /* where prose line-boxes start within a cell */
--gutter-line: var(--cell); /* accent-line offset into the left gutter */
```

The cell is **chosen to fit the type, not vice versa**: 19px serif body text
reads best at ~30px leading, so the cell is 30px and body `line-height` is
exactly one cell. That is the load-bearing fact of the whole system — for a
text line to have the same relationship to the ruled background as every other
line, its line-height must be an integer multiple of the cell. There is no
"almost": 30.4px leading on a 24px grid (the original design) produces rules
that drift through the text and re-sync only every ~150px.

**Never write a literal rhythm number.** CSS uses `var(--cell)` /
`calc(var(--cell) * n)`. JS reads it:

```js
parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell'))
```

Current readers: the snap util in `Layout.astro`, the index snap + hover
brackets in `PostStream.astro`, the glider density in `Glider.astro`.

## Phase: why 7px

Rules sit at `y ≡ 0 (mod 30)` in document space — the background is anchored
to the document top and is **never phase-shifted** (media panels and the index
snap statically depend on `k * cell` alignment). Instead, the *text* carries
the phase: prose line boxes start at `y ≡ 7 (mod 30)`. With 19px Source Serif
in a 30px box, the baseline lands ~21px into the box, so the next rule (at
+23px) passes ~2px under the baseline — the ruled-paper look. If the body font
or size ever changes, retune `--rhythm-phase` visually with the `?rhythm`
overlay (below).

So there are exactly two vertical alignment targets:

| what | target (mod 30) | why |
|---|---|---|
| framed blocks (figure, code shell, table, callout, TOC) | **0** | border sits on a lattice line — "taped onto the graph paper" |
| text flow (p, h2, h3, li, …) | **7** (`--rhythm-phase`) | rules pass just under baselines |

## The three tiers

**Tier 1 — prose flow (strict arithmetic).** Everything that flows as text in
the article column. Rules:

- `line-height` is a whole number of cells. `article { line-height: var(--cell) }`
  sets it as an inherited *length*, so nested font sizes keep the 30px box.
  Elements with their own metrics (`pre` 13/1.7, `figcaption` 13/1.5, `table`
  1.6, the masthead `h1`) override it deliberately — they're Tier-2 interiors.
- Every element must satisfy `extent + margin-bottom + next.margin-top ≡ 0
  (mod cell)`, where extent = line boxes + padding + borders. Examples that
  live in `global.css`:
  - `p`: 30n lines + 30px margin-bottom.
  - `h2`: 30 (margin-top) + 41 (30 line + 10 padding + 1 border) + 19
    (margin-bottom) = 90. **The 19px is not a typo** — it compensates the 41px
    underline extent. Do not "clean it up" to 20 or 30.
  - `h3`: 30 + 30 + 30.
- `.prose` is a **flex column**. This is what makes the arithmetic exact:
  flex items never collapse margins, so gaps are literal sums. Under normal
  flow, collapse takes `max(m1, m2)`, which is only safe if *every* margin is
  a cell multiple — and h2's 41px extent makes that impossible to guarantee
  (h2 followed directly by h3 broke before this). If you remove the flex,
  the system silently degrades in exactly that kind of adjacency.

**Tier 2 — opaque/arbitrary blocks (snapped at runtime).** Figures, code
shells, tables, callouts, the inline TOC, and the masthead (`header.entry` —
its `clamp()` headline makes static math impossible). Their *interiors* don't
need alignment: their surfaces hide the grid anyway. Only their boundaries
matter, and a snap util in `Layout.astro` enforces them after layout:

- nudges each block's `margin-top` so its border-top lands on a rule (≡ 0) —
  except the masthead, whose top isn't a visible edge;
- nudges its `margin-bottom` so the next element starts at ≡ 7 (or ≡ 0 if the
  next element is itself a framed block).

It measures the neighbor's *actual* position and iterates (up to 4×) rather
than computing margins arithmetically, so it is immune to collapse quirks. It
runs at script parse (before first paint; Astro images carry width/height so
layout is already final), and again on `load`, debounced `resize`, and
`fonts.ready` (the serif swap changes metrics). Tier-2 blocks carry
`margin-top: 0` in CSS — the preceding element's cell-multiple margin-bottom
sets the base gap and the snap adds the remainder (0–29px).

The index does **not** use this util (it's gated on `.prose` existing); it has
its own older snap in `PostStream.astro` that aligns the log header.

**Tier 3 — chrome (exempt, on purpose).** Site header, nav, pagers, the fixed
TOC sidebar, lightbox, socials. Not reading surfaces; forcing them onto the
grid is cost without perceptual payoff. The exemption is part of the design —
don't creep the grid into them.

## Verifying

**Visual:** append `?rhythm` to any URL. A red 1px line is drawn at every cell
boundary; framed-block borders should coincide with red lines, and text should
start 7px below them.

**Numeric (the real test):** paste in the console on a post page:

```js
const mod = (y) => Math.round(((y % 30) + 30) % 30);
const doc = (el) => el.getBoundingClientRect().top + window.scrollY;
console.log('blocks (want 0):', [...new Set(
  [...document.querySelectorAll('main.post article :is(.toc, figure.fig, figure.code, .tbl-wrap, .callout)')]
    .filter((el) => el.offsetParent !== null).map((el) => mod(doc(el))))]);
console.log('text (want 7):', [...new Set(
  [...document.querySelectorAll('.prose > :is(p,h2,h3)')].map((el) => mod(doc(el))))]);
console.log('off-grid paragraphs (want 0):',
  [...document.querySelectorAll('.prose > p')]
    .filter((p) => p.getBoundingClientRect().height % 30 !== 0).length);
```

Expected output: `blocks [0]`, `text [7]`, `0`. Anything else is a leak.

**Beware the cache:** the numeric audit once showed identical failures after a
fix because Chrome served the stale page from the `http.server` preview. If
numbers refuse to change, add a cache-buster (`?cb=1`).

## Adding new content or components — the checklist

1. **Is it chrome (outside the reading column)?** Tier 3, ignore the grid.
2. **Is it text that flows in the prose?** Tier 1: line-height in whole cells,
   flow margins in whole cells (the snap will not save mid-flow arithmetic).
3. **Is it a block with arbitrary/opaque content?** Tier 2: give it
   `margin: 0 0 var(--cell)`, an opaque background or border so the grid
   misalignment inside is invisible, and add its selector to `BOXY` in
   `Layout.astro`'s snap util. Note the snap skips elements nested inside
   another `BOXY` match (that's why the `pre` inside a code shell isn't
   double-snapped) and skips non-rendered siblings (Astro emits `display:none`
   `<script>` tags into the flow; aligning against their 0,0 rects produces
   scroll-dependent garbage).
4. **New inline element inside prose?** (chips, badges, kbd, sup/sub…) Make
   sure it cannot grow the 30px line box: keep its `line-height` at 1 and
   avoid `vertical-align` values that raise its inline box. This is not
   theoretical — the inline `code` chip's mono metrics overflowed the strut by
   1px and de-phased the entire second half of a post.
5. **Run the numeric audit on both posts** (both themes don't matter — the
   geometry is theme-independent).

## Known trade-offs (decided, not bugs)

- The masthead's own top edge sits off-grid (≡ 13). Only its bottom boundary
  is snapped; its top isn't a visible border, so alignment there buys nothing.
- The h2 underline floats mid-cell. Heading *baselines* ride the rules like
  prose (one phase for all of Tier 1); putting the underline on a lattice line
  instead would need `padding-bottom: 23px` and read as a detached rule.
- Without JS, Tier 2 boundaries don't snap: figures de-phase the text after
  them until the next block. Tier 1 arithmetic still holds, so this degrades
  to "rules at a consistent but arbitrary offset per section" — the pre-snap
  state, readable and calm.
- `line-height-step` (CSS Rhythmic Sizing) would replace most of Tier 1 with
  one declaration; it never shipped cross-browser. If it ever does, revisit.
