# Language components for blocks

Block parameters are not in the static schema: each block type and version ships its own
`parameters`, `actions` and `events` from its manifest, and the base `BlockDefinition` leaves those
keys open. The structural walk therefore mounts `BlockDefinition` and stops. Blocks resolve through
a value-directed hook instead.

## How production validates blocks

`validateAppDefinition` (`validation.ts`) fetches each block's manifest (`getBlockVersions`), then
walks every block (`iterApp.onBlock`) and validates its `parameters` against that block's own
schema. It is linear in the number of blocks and never asks one `jsonschema` pass to discriminate
across all blocks. The engine follows the same model: find the block, then use its own schema.

## How the language server encodes blocks for yaml-ls

yaml-language-server is a declarative `jsonschema` engine and cannot call a per-block validator.
`appsembleSchemaConfig.ts` seeds `BlockDefinition.allOf = [{ allOf: [] }]`, and
`blockRegistryHandlers.ts` fills the inner `allOf` with one `if`/`then` branch per available block:

```ts
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

An async schema request service resolves the `appsemble://` refs on demand. This construct makes
whole-document validation O(blocks) per block node, and the walk does not descend `if`/`then`, so
the engine never navigates it.

## The value-directed hook

`ResolveOptions.dynamicChild` is consulted by `resolveAtKey` before the structural child lookup:

```ts
type DynamicChild = (
  parentIdentity: string | null,
  parentValue: unknown,
  key: string,
) => Schema | null;
```

At a `BlockDefinition` node, resolving `parameters`, `actions` or `events` reads `type` and
`version` and returns that block's schema object: O(1), no union, no `if`/`then`. Because it returns
the object rather than a `$ref`, it does not depend on ref keying. The same hook fits any union
discriminated by a direct value.

`dynamicChild` is synchronous. Loading what it reads is a separate async hook,
`ResolveOptions.loadDynamicChild`, which the async descent (`Node.childAsync`, `buildTreeAsync`,
`scanAsync`) awaits right before each step, so a block manifest arrives when the walk reaches that
block. The per-edit rebuild stays synchronous through `buildTree` and reads what is already loaded.
`blocks-dynamic.test.ts` and `blocks-async.test.ts` cover both paths.

## Where block schemas come from

`blockRegistry.ts` defines the `BlockRegistry` port the host injects (`getManifest`, `listBlocks`,
`listVersions`) and derives the schemas from a manifest: `blockParametersSchema`,
`blockActionsSchema` and `blockEventsSchema`. Fetching and caching manifests is the host's part.
`compileDialect` (`dialect.ts`) passes a consumer's `dynamicChild` and `loadDynamicChild` through to
the compiled context.

## Ref keying

Where block schemas are reached by `$ref`, `SchemaRegistry.resolveRef` matches the full id or URL
exactly and falls back to the `#/components/schemas/{name}` prefix for base components. A
last-segment lookup would collapse every `appsemble://.../parameters.json` onto one key.
