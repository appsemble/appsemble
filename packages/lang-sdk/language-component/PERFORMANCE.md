# Language component analyzer performance notes

## Where the time goes

A whole-document `scan` has two halves of similar cost on a large app:

- **Walk**: per-node identity resolution. The ref-cut keeps it proportional to the document, and
  consecutive editor edits leave nearly all of it unchanged, so incremental re-analysis skips most
  of it.
- **`collectHits`**: one full-ref `jsonschema` validation for `documentValid`, `errors` and `hits`.
  The tree does not need it, because the walk already produces identity. Callers run it on their own
  cadence (an editor computes diagnostics when idle, not per keystroke).

## Ref-cut

`localShapeFactory()` memoizes `stripRefs(schema)` by schema-object identity: each schema node is
stripped to its local shape once, and every `$ref`-reached revisit reuses the copy. Validating
against the full schema instead would re-validate every referenced subtree inside each ancestor (O(N
x depth)).

A node's resolution depends on its value only down to the next `$ref` boundary. That is what makes
incremental re-analysis correct: re-walking from a boundary reproduces the subtree regardless of
anything above it.

## Incremental re-analysis (`buildTree`)

The caller passes the changed paths (an editor has them from edit ranges). The engine re-walks only
the subtree enclosing each, from the nearest `$ref` boundary (`Node.boundaryAt`), and reuses the
rest of the previous tree. No hashing or diffing: the retained previous tree is the cache. A
single-leaf edit costs the size of its enclosing boundary, not the document. Edits scattered across
the app (such as a whole commit) touch many boundaries and gain little.

## `jsonschema` validator sharp edges

These affect only the full-ref `collectHits` pass. A compiling validator such as Ajv addresses the
first two at once.

1. **`makeChild` resolves a URL per node.** Appsemble schemas are `$id`-less and almost entirely
   `$ref`-reached, so the resolution is wasted work. `skipBaseResolutionForSchemasWithoutId` skips
   it process-wide once a `BaseValidatorFactory` has built; the engine's own `Validator` benefits
   only after that.
2. **No `$ref`-resolution cache.** A `Validator` subclass with a memoized `resolve` fixes it; it
   pays off only once (1) is addressed.
3. **`ObjectRemapperDefinition` is a large closed object.** Every remapper node enumerates all its
   properties. A discriminated `oneOf` (type key first, short-circuit) makes `validateProperties`
   roughly linear in nodes for any validator.

## Conditional applicators

The engine is a pure walk: the static Appsemble schemas are OpenAPI 3.0 components with no
`if`/`then`, `dependentSchemas` or `unevaluated*`. The one `if`/`then` construct is the language
server's block schema, which the engine sidesteps through `dynamicChild` (see `BLOCKS.md`). If a
conditional applicator ever needs walking, collect hits during the walk, locally on the marked
nodes, rather than with a whole-app pass.
