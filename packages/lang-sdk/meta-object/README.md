# Meta-Object Prototype

This folder builds Appsemble-style DSL object identities from JSON Schema annotations, keeping
`jsonschema` as the validation engine while deriving a live object tree for validation, completion,
code actions, and editor tooling.

## Engine

`MetaAnalyzer` compiles a schema set once and drives every analysis. Tree building and document
validation are separate operations:

```text
new MetaAnalyzer(schemas)          compile registry + validators + ref-cutoff cache once
  .buildTree(data, rootSchema)     -> identity tree (walk only): interpretations
  .validate(data, rootSchema)      -> documentValid + errors (+ hits)
  .analyze(data, rootSchema)       -> both, combined (the original result shape)
```

`analyzeMetaObjects(data, rootSchema, schemas)` is a one-shot convenience equal to
`new MetaAnalyzer(schemas).analyze(...)`.

- The walk owns the whole tree. `resolve` is the single place a `oneOf`/`anyOf`/`allOf` is decided;
  it returns the identity at a node and the concrete winner schema(s). `governingChild` then does
  pure structural lookup on those winners, so navigation only ever descends winning branches and
  never re-validates — losing-branch ghosts are never mounted.
- `validate` produces `documentValid` and `errors` independently of the walk, so a caller runs it on
  its own cadence. Its `hits` are kept for tooling but do not drive the tree.
- The walk reaches everything Appsemble's OpenAPI 3.0 schemas can express. It cannot reach
  meta-objects placed behind conditional/pattern applicators (`if`/`then`, `patternProperties`),
  which those schemas do not support; if they ever appear, a walk-driven local probe would cover
  them (see `PERFORMANCE.md`).

## Incremental re-analysis

After an edit, re-analyze by handing `buildTree` the previous tree and the changed data paths (an
LSP has these from its edit ranges):

```ts
const analyzer = new MetaAnalyzer(schemas);
let tree = analyzer.buildTree(app, rootSchema);
// User edits app at /pages/0/blocks/2/parameters/title
tree = analyzer.buildTree(app, rootSchema, {
  previous: tree,
  changed: [['pages', 0, 'blocks', 2, 'parameters', 'title']],
});
```

Only the subtree enclosing each changed path (from its nearest `$ref` boundary) is re-walked; the
rest of the tree is reused. On a ~2,300-object app a single-leaf edit is ~37 ms versus ~3.1 s for a
full build (see `PERFORMANCE.md`). No hashing or diffing — the retained previous tree is the cache,
and the caller supplies what changed.

## Annotation

Identity comes only from `appsembleMetaObject`; a schema graph carrying no such tags produces an
empty tree. Wrappers and leaves can both be tagged:

```ts
const Widget = {
  appsembleMetaObject: { name: 'Widget', mode: 'oneOf' },
  oneOf: [
    { $ref: '#/components/schemas/ButtonWidget' },
    { $ref: '#/components/schemas/IconWidget' },
  ],
};

const ButtonWidget = {
  appsembleMetaObject: { name: 'ButtonWidget', mode: 'object' },
  type: 'object',
  required: ['type', 'text'],
  properties: { type: { const: 'button' }, text: { type: 'string' } },
};
```

The shipped Appsemble schemas carry no such tags. To use the engine against them, tag the registry
with `annotateSchemas` (each named object/combinator schema becomes a meta-object; scalars and
already-tagged schemas pass through). `annotateSchema` tags a single schema.

```ts
import { annotateSchemas, MetaAnalyzer } from '@appsemble/lang-sdk';
import * as rawSchemas from '@appsemble/lang-sdk/schemas';

const schemas = annotateSchemas(rawSchemas as Record<string, Schema>);
const analyzer = new MetaAnalyzer(schemas);
// Mounts / -> AppDefinition, /pages/0 -> PageDefinition, ...
analyzer.analyze(app, schemas.AppDefinition);
```

Untagged combinators are still transparent — an anonymous `oneOf`/`anyOf`/`allOf` surfaces the
identities of its tagged branches — but an untagged plain object mounts nothing, which is why the
named object schemas above need tagging.

The keyword is configurable: `annotateSchemas(raw, key)` and `new MetaAnalyzer(schemas, key)` both
default to `META_KEY` (`appsembleMetaObject`) but accept any key, as long as the two agree.

## Files

- `analyze.ts`: the engine — `MetaAnalyzer` (`buildTree`/`validate`/`analyze`), incremental
  re-analysis, and the `analyzeMetaObjects()` one-shot convenience.
- `annotate.ts`: `annotateSchema` / `annotateSchemas`, which tag object and combinator schemas so
  the analyzer mounts identities for them.
- `types.ts`: `MetaIdentity`, `MetaInterpretation`, `MetaHit`, `MetaTag`, `META_KEY`/`metaTag`, and
  the `jsonschema` `Schema` augmentation for `appsembleMetaObject`.
- `path.ts`: JSON Pointer-safe path formatting and lookup.
- `schemaRegistry.ts`: synchronous schema registry for `$ref` resolution.

## Identity

```text
object: a single concrete meta-object
oneOf:  exactly one candidate matches
anyOf:  every matching candidate becomes a composite
allOf:  every candidate matches and becomes a composite
```

Resolved shapes read as `Widget:oneOf(IconWidget)` or
`StoredText:allOf(Identified, Timestamped, TextWidget)`; ambiguous or failed algebra becomes
`unresolved(...)`. Local identity is kept separate from whole-document validity: a value can resolve
as `ExperimentalButton` while an outer `if`/`then` makes the document invalid, and the node carries
those errors.

## Constraints

- `$ref` resolution is synchronous; external/block schemas must be loaded first.
- Map keys use JSON Pointer escaping, never `path.join('.')`.
- Coverage is bounded by what the walk can navigate structurally: meta-objects placed only behind
  conditional/pattern applicators (`if`/`then`, `patternProperties`) are not discovered. Appsemble's
  OpenAPI 3.0 schemas cannot express those, so this bound is not hit in practice.
