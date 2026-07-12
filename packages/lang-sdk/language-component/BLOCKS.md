# Language components for blocks (design)

**Status: design + prototype only. Not implemented in the engine.**

Block parameters are not in the static schema: each block type/version ships its own parameters JSON
Schema (from its manifest), and the base `BlockDefinition` leaves `parameters` (and `actions`,
`events`) open — so the analyzer mounts `BlockDefinition` but nothing under it (confirmed on
reservations: 100 `BlockDefinition`s, zero block-param language components).

## How the LSP (685-lsp) solves it

`appsembleSchemaConfig.ts` seeds `BlockDefinition.allOf = [{ allOf: [] }]`, and
`blockRegistryHandlers.ts` fills that inner `allOf` with one **`if`/`then` branch per available
block**:

```ts
// One entry per block in the inner allOf.
const branch = {
  if: {
    required: ['type', 'version'],
    properties: {
      // Matches the org-prefixed name and the short name.
      type: { oneOf: [{ const: '@org/name' }, { const: 'name' }] },
      version: { const: '1.2.3' },
    },
  },
  then: {
    properties: {
      parameters: { $ref: 'appsemble://blocks/@org/name/1.2.3/parameters.json' },
      actions: { $ref: 'appsemble://blocks/@org/name/1.2.3/actions.json' },
      events: { $ref: 'appsemble://blocks/@org/name/1.2.3/events.json' },
    },
  },
};
```

The `appsemble://` refs are resolved on demand by an async schema request service. Each block
contributes three schemas — `parameters`, `actions`, and `events` — not just parameters.

## Fit with the language component walk

The walk resolves `oneOf`/`anyOf`/`allOf` by structural matching, but it does **not** descend
`if`/`then` — conditional applicators are outside walk coverage (see `README.md` and
`PERFORMANCE.md`). The LSP construct above is an `allOf` of `if`/`then` conditionals, so it is
precisely the shape the walk cannot navigate. Reusing the LSP's assembled schema to mount block
params is therefore not an option: the walk would mount `BlockDefinition` and stop, exactly as it
does against the open base schema.

A block is discriminated by a direct value (`type` + `version`), so the engine does not need to
reconstruct a union at all — it can look the block up. This is Approach B.

## Approach B: a value-directed resolver hook

Add an optional `ResolveContext` hook that `childSchema` consults when descending:

```text
dynamicChild?(parentIdentity: string, parentValue: unknown, key: string): Schema | null;
```

At a `BlockDefinition` node, resolving `parameters` (or `actions`/`events`) reads `type` + `version`
and returns that block's schema from a per-app registry — O(1), no union, no `if`/`then`, no
pre-patching. It hands back the schema _object_, so it sidesteps ref keying entirely. The same hook
generalizes to any `type`-discriminated union (e.g. actions). Cost: an engine extension, and the
registry must be injected by the consumer.

### Sync materialization: two walks with an async fetch between

`$ref` and the resolver both run synchronously, so a block's schema must be in the per-app registry
before the pass that walks into it. The first walk _is_ the discovery: it mounts every
`BlockDefinition` (params still unresolved). The consumer then fetches only the reached blocks and
re-walks just the block subtrees via the incremental API:

```ts
const a0 = new Scanner(baseSchemas);
// Blocks mount; params unresolved.
let tree = a0.buildTree(app, root);
const blocks = [...tree.mounts.values()].filter((i) => i.identity.name === 'BlockDefinition');
// Async fetch lives in the consumer.
const registry = await fetchBlockSchemas(blocks.map((i) => tree.valueAt(i.path)));
const a1 = new Scanner(baseSchemas, { dynamicChild: registry.resolve });
tree = a1.buildTree(app, root, { previous: tree, changed: blocks.map((i) => i.path) });
```

`previous` is plain data, so the second analyzer reuses every non-block interpretation. Fetching
cannot happen _inside_ a sync walk — hence two walks with the async fetch between them:

```mermaid
sequenceDiagram
  participant C as Consumer
  participant A0 as Scanner a0
  participant F as fetchBlockSchemas
  participant A1 as Scanner a1 (dynamicChild)
  C->>A0: buildTree(app, root)
  A0-->>C: tree, BlockDefinition mounted, parameters unresolved
  C->>C: filter mounts for BlockDefinition
  C->>F: await fetch(block values)
  Note over C,F: async, cannot run inside a sync walk
  F-->>C: per-app registry keyed by type+version
  C->>A1: buildTree(app, root, previous tree + changed block paths)
  A1-->>C: childSchema consults dynamicChild; parameters mount, non-block nodes reused
```

### Annotation

Run manifest param/action/event schemas through `annotateSchemas` (namespaced, e.g.
`@org/name@version/parameters`) so their structure mounts as language components once the resolver
returns them.

## The URL-aware registry

Approach B never forms a `$ref` to a block schema — it hands back the schema object — so it does not
depend on ref keying. The registry's URL-aware `resolveRef` still matters wherever block schemas
_are_ reached by `$ref` (base-component resolution, and any consumer that does register block
schemas by URL):

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

Caveat: `buildTree` resolves refs via `resolveRef` (identity works immediately), while
`validate`/`collectHits` route through the jsonschema validator, whose handling of the non-standard
`appsemble://` scheme needs checking. The measured `analyze` cliff and its fix — Approach B plus a
resolver-registered, scoped/debounced validator, no `jsonschema` patching — are in
`USABILITY-3RD-MR.md` §6.

## Status / prerequisites

The walk-driven approach mounts block params once fetched schemas are materialized between the two
walks and the `dynamicChild` hook is wired. Still required for real use: the `dynamicChild` engine
extension, and block schema fetching (exists in the LSP). Recommendation: **Approach B** — the LSP's
`if`/`then` construct is not walkable, so a value-directed resolver is the path, not a fallback.
