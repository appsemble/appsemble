# Language component analyzer performance notes

Profiled on a real ~3,300-line app (sittard-geleen reservations, ~2,300 language components,
remapper-heavy).

## Where the time goes

A single `scanComponents` run was ~8.2 s, split roughly in half:

- **~4.1 s walk + fallback** — per-node identity resolution. The ref-cutoff (`stripRefs` in
  `scanner.ts`) already cuts this ~2–4x, and ~98–100% of it is redundant across consecutive editor
  edits, so incremental re-analysis skips nearly all of it.
- **~4.2 s `collectHits`** — one full-ref `jsonschema` validation for `documentValid` + `errors` +
  `hits`. This is the painful half, and it is **not needed to build the tree** — the walk already
  produces identity. Expose it as a separate call the caller runs on its own cadence (an LSP
  computes diagnostics on idle, not per keystroke).

**Ref-cutoff rationale.** `createShallow()` memoizes `stripRefs(schema)` by schema-object identity
for a run: each schema node is stripped to its local shape once, and the many `$ref`-reached
revisits reuse the cached copy. A node's resolution then depends on its value only down to the next
`$ref` boundary — which is exactly what makes incremental re-analysis correct: re-walking from a
boundary reproduces the subtree independent of anything above it. (A per-run `(value, schema)`
validation memo was tried and dropped — the costly validations are all distinct, so nothing hit.)

## Incremental re-analysis (shipped: `Scanner.buildTree`)

The caller passes the changed paths (an LSP has them from edit ranges); the engine re-walks only the
subtree enclosing each, from the nearest `$ref` boundary (`boundaryFor`), and reuses the rest of the
previous tree. No content hashing, diffing, or library — the retained previous tree is the cache.
Checked against a full analysis every time (identical `interpretations` throughout):

- **single-leaf edit (per-keystroke case): 3,148 ms → 37 ms, 84x** on reservations (2,339 objects).
- replaying 84 git commits: only 1.6x — each commit bundles ~33 scattered edits whose boundaries
  cover much of the app. Git-commit granularity is not editor granularity.

## Commit-sequence replay (measured)

From-scratch cost per revision, replaying ~1,400 real revisions:

| app          | revs | total replay | median/rev | tracks        |
| ------------ | ---: | -----------: | ---------: | ------------- |
| person       |  347 |       41.6 s |      98 ms | 49 objects    |
| notes        |  347 |       44.9 s |     135 ms | 33 objects    |
| unlittered   |  342 |       71.2 s |     205 ms | 66 objects    |
| remappers    |  284 |      381.0 s |     1.35 s | 790 objects   |
| reservations |   84 |      359.7 s |     4.00 s | 2,339 objects |

From-scratch cost is strictly linear (scales with object count); nothing carries between adjacent
~98%-identical commits — the case incremental re-analysis exists to fix. The `emit` error-filter
O(objects × errors) blowup is a real code-level sharp edge but dormant on real data (broken states
carry only a handful of errors).

## Known `jsonschema` validator sharp edges (follow-ups)

Relevant only to the full-ref `collectHits` pass; do not patch the validator — keep the pass off the
hot path instead (or migrate to a compiling validator such as Ajv, which addresses 1–2 at once).

1. **`makeChild` runs a `url.parse` per node (dominant, ~55% of validation CPU).** Skipping the
   `uri.resolve` when there is no `$id` took full-ref validation 3,775 ms → 904 ms, identical
   result. Appsemble schemas are `$id`-less and almost entirely `$ref`-reached, so the clean
   `ctx`-dispatch lever barely helps; a full fix needs overriding `validateSchema`.
2. **No `$ref`-resolution cache (~6%).** A `Validator` subclass with a memoized `resolve` fixes it
   cleanly, but it is gated behind (1); apply only once (1) is addressed.
3. **`ObjectRemapperDefinition` is a fat 77-property closed object.** ~2,000 remapper nodes each
   enumerate all 77 properties. A discriminated `oneOf` (type-key-first, short-circuit) cuts
   `validateProperties` from O(nodes × 77) to ~O(nodes) and helps any validator.

The engine ships as the **pure walk**; the conditional-placement hit fallback was removed because
the static Appsemble schemas are OpenAPI 3.0 components (no
`if`/`then`/`dependentSchemas`/`unevaluated*`). The one place `if`/`then` does arise is the LSP's
dynamically-assembled block schema (`BlockDefinition.allOf` of per-block `if`/`then` branches, see
`BLOCKS.md`), and the engine sidesteps it: blocks resolve through the value-directed `dynamicChild`
hook (Approach B), not by navigating the conditional. So no walk reaches an `if`/`then`, and the
whole-app hit fallback stays removed. If a conditional applicator ever needs walking, make hit
collection walk-driven and local (probe only marked nodes during the walk) rather than reviving a
whole-app hit pass.
