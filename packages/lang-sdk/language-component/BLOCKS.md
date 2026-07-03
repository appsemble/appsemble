# Language components for blocks (design)

**Status: design + prototype only. Not implemented in the engine.**

Block parameters are not in the static schema: each block type/version ships its own parameters JSON
Schema (from its manifest), and the base `BlockDefinition` leaves `parameters` open — so the
analyzer mounts `BlockDefinition` but nothing under it (confirmed on reservations: 100
`BlockDefinition`s, zero block-param language components).

## How the LSP (685-lsp) solves it

`appsembleSchemaConfig.ts` patches `BlockDefinition.allOf = [{ oneOf: [] }]` with one branch per
available block —
`{ type: <const>, version: <const>, parameters: { $ref: 'appsemble://blocks/@org/name/version/parameters.json' } }`
— discriminated by `type`+`version`, the `appsemble://` refs resolved on demand by an async schema
request service.

## Fit with the language component walk

A **discriminated `oneOf` (not `if`/`then`)** is exactly what the walk resolves: `type`+`version`
make one branch match and the walk descends into its `parameters`. Two adjustments:

1. **Sync materialization, walk-driven — no pre-scan.** `$ref` resolves synchronously, so a block's
   schema must be in the registry before the pass that walks into it. The first walk _is_ the
   discovery; fetch only the blocks it reached, then re-walk just the block subtrees via the
   incremental API:

   ```ts
   const a0 = new Scanner(baseSchemas);
   // Blocks mount; params unresolved.
   let tree = a0.buildTree(app, root);
   const blocks = [...tree.interpretations.values()].filter(
     (i) => i.identity.name === 'BlockDefinition',
   );
   // Async fetch lives in the consumer.
   const blockSchemas = await fetchBlockSchemas(blocks.map((i) => i.value));
   const a1 = new Scanner({ ...baseSchemas, BlockDefinition: wiredBlockDef });
   tree = a1.buildTree(app, root, { previous: tree, changed: blocks.map((i) => i.path) });
   ```

   `previous` is plain data, so the second analyzer reuses every non-block interpretation. Fetching
   cannot happen _inside_ a sync walk — hence two walks with the async fetch between them:

   ```mermaid
   sequenceDiagram
     participant C as Consumer
     participant A0 as Scanner a0
     participant F as fetchBlockSchemas
     participant A1 as Scanner a1
     C->>A0: buildTree(app, root)
     A0-->>C: tree, BlockDefinition mounted, parameters unresolved
     C->>C: filter interpretations for BlockDefinition
     C->>F: await fetch(block values)
     Note over C,F: async, cannot run inside a sync walk
     F-->>C: per-block parameter schemas
     C->>A1: buildTree(app, root, previous tree + changed block paths)
     A1-->>C: parameters mount as FormParams, non-block nodes reused
   ```

2. **Annotation.** Run manifest param schemas through `annotateSchemas` (namespaced, e.g.
   `@org/name@version/parameters`) so their structure mounts as language components.

## Two approaches

**A. Inline per-app, reusing the LSP `oneOf` (zero engine change).** Build a per-app
`BlockDefinition` whose `oneOf` has one branch per used block, each pointing `parameters` at that
block's fetched schema by its real URL; the URL-aware registry (below) makes those first-class
`$ref` targets. Pro: reuses the LSP assembly. Con: the walk validates each block value against _all_
branches — the fat-schema cost `PERFORMANCE.md` flags, O(blocks) per node (see §6 link below for the
measured cliff).

**B. Value-directed resolver hook (recommended when block count bites).** A block is discriminated
by a direct value, so look it up instead of forming a union. Add an optional `ResolveContext` hook:

```text
dynamicChild?(parentIdentity: string, parentValue: unknown, key: string): Schema | null;
```

`governingChild` consults it: at a `BlockDefinition` node, resolving `parameters` reads `type`+
`version` and returns that block's schema from a per-app registry — O(1), no fat `oneOf`, no
pre-patching, and it hands back the schema _object_ so it sidesteps ref keying. Generalizes to any
`type`-discriminated union (actions). Con: engine extension; the registry must be injected.

## The URL-aware registry

Bare last-segment lookup only reaches a schema if a `$ref` ends in its key — fine for uniquely-named
components, wrong for blocks (every `appsemble://…/parameters.json` collapses to the same segment).
`resolveRef` keys by full id/URL with exact match, falling back to the `#/components/schemas/{name}`
prefix for base components (a deeper pointer is not a named component, so it errors rather than
resolving to an unrelated same-named schema):

```text
resolveRef(ref) {
  const prefix = '#/components/schemas/';
  const name = ref.startsWith(prefix) ? ref.slice(prefix.length) : ref;
  return this.schemas[ref] ?? this.schemas[name];
}
```

So block params are first-class `$ref` targets keyed by full URL (Approach A uses this; B never
touches refs). Caveat: `buildTree` uses `resolveRef` directly (identity works immediately), while
`validate`/`collectHits` route through the jsonschema validator, whose handling of the non-standard
`appsemble://` scheme needs checking. The measured ~100 s `analyze` cliff on the fat `oneOf` and its
fix — Approach B plus a resolver-registered, scoped/debounced validator, no `jsonschema` validator
patching — are in `USABILITY-3RD-MR.md` §6.

## Status / prerequisites

Registry is URL-aware; the walk-driven approach mounts URL-keyed block params once fetched schemas
are materialized between the two walks. Still required for real use: block schema fetching (exists
in the LSP). Recommendation: **A** for fast parity; **B** when block-node count makes the fat
`oneOf` a real cost.
