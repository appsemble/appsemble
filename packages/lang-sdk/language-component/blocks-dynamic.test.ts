import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import {
  buildTree,
  type DynamicChild,
  LanguageComponent,
  LanguageCtx,
  type MountIndex,
  scan,
} from './index.js';

/*
 * Blocks via the value-directed resolver (language-component/BLOCKS.md).
 *
 * The base BlockDefinition leaves `parameters` open -- no oneOf, no allOf, no if/then, so the
 * structural walk mounts BlockDefinition and stops. A `dynamicChild` hook reads the block's
 * `type`+`version` and hands back that block's schema object directly, so `parameters` mounts
 * without materializing any union. This is the shape the engine grows for blocks; the LSP's
 * assembled allOf-of-if/then is never walked.
 */
const FormParams = LanguageComponent.define(
  'FormParams',
  { type: 'object', properties: { fields: { type: 'array' } } },
  {},
);
const TableParams = LanguageComponent.define(
  'TableParams',
  { type: 'object', properties: { columns: { type: 'array' } } },
  {},
);

// A per-app block registry keyed by type+version, populated (in real use) between the two
// walks from fetched manifests. Here it is hand-built in place of the async fetch.
const blockRegistry = new Map<string, Schema>([
  ['form@0.0.0', FormParams.schema],
  ['table@0.0.0', TableParams.schema],
]);

const resolveBlockChild: DynamicChild = (parentIdentity, parentValue, key) => {
  if (parentIdentity !== 'BlockDefinition' || key !== 'parameters') {
    return null;
  }
  const block = parentValue as { type?: string; version?: string };
  return blockRegistry.get(`${block.type}@${block.version}`) ?? null;
};

const schemas: Record<string, Schema> = LanguageComponent.schemas([
  // `parameters` is deliberately absent from the schema: only the resolver can reach it.
  LanguageComponent.define(
    'BlockDefinition',
    {
      type: 'object',
      properties: { type: { type: 'string' }, version: { type: 'string' } },
    },
    {},
  ),
  LanguageComponent.define(
    'PageDefinition',
    {
      type: 'object',
      properties: {
        blocks: { type: 'array', items: { $ref: '#/components/schemas/BlockDefinition' } },
      },
    },
    {},
  ),
  LanguageComponent.define(
    'AppDefinition',
    {
      type: 'object',
      properties: {
        pages: { type: 'array', items: { $ref: '#/components/schemas/PageDefinition' } },
      },
    },
    {},
  ),
]);

describe('blocks via value-directed resolver', () => {
  it('mounts block parameters resolved by type+version, with no union in the schema', () => {
    const app = {
      pages: [
        {
          blocks: [
            { type: 'form', version: '0.0.0', parameters: { fields: [] } },
            { type: 'table', version: '0.0.0', parameters: { columns: [] } },
          ],
        },
      ],
    };
    const result = scan(
      LanguageCtx.compile(schemas, 'AppDefinition', { dynamicChild: resolveBlockChild }),
      app,
    );

    expect(result.mounts.get('/pages/0/blocks/0')?.identity.name).toBe('BlockDefinition');
    // Each block's parameters resolve to a different schema, chosen by its own type+version.
    expect(result.mounts.get('/pages/0/blocks/0/parameters')?.identity.name).toBe('FormParams');
    expect(result.mounts.get('/pages/0/blocks/1/parameters')?.identity.name).toBe('TableParams');
  });

  it('mounts nothing under parameters without the resolver, proving the schema carries no union', () => {
    const app = { pages: [{ blocks: [{ type: 'form', version: '0.0.0', parameters: {} }] }] };
    const result = scan(LanguageCtx.compile(schemas, 'AppDefinition'), app);

    expect(result.mounts.get('/pages/0/blocks/0')?.identity.name).toBe('BlockDefinition');
    expect(result.mounts.has('/pages/0/blocks/0/parameters')).toBe(false);
  });

  it('descends the resolved child through a cursor identically to the walk', () => {
    const app = { pages: [{ blocks: [{ type: 'form', version: '0.0.0', parameters: {} }] }] };
    const params = LanguageCtx.compile(schemas, 'AppDefinition', {
      dynamicChild: resolveBlockChild,
    })
      .root(app)
      .child('pages')
      ?.child(0)
      ?.child('blocks')
      ?.child(0)
      ?.child('parameters');

    expect(params?.identity?.name).toBe('FormParams');
  });
});

describe('incremental boundaries honor the value-directed resolver', () => {
  // BlockDefinition declares a generic `parameters` schema that the resolver overrides per block.
  // A full walk mounts the resolved override; an incremental rebuild must too. The re-walk root is
  // found by boundaryFor, which therefore has to descend the same way the walk does -- a plain
  // structural lookup would follow the generic `$ref` and re-walk the wrong schema.
  const GenericParams = LanguageComponent.define(
    'GenericParams',
    { type: 'object', properties: { raw: { type: 'object' } } },
    {},
  );
  const overrideSchemas: Record<string, Schema> = LanguageComponent.schemas([
    GenericParams,
    FormParams,
    LanguageComponent.define(
      'BlockDefinition',
      {
        type: 'object',
        properties: {
          type: { type: 'string' },
          version: { type: 'string' },
          parameters: { $ref: '#/components/schemas/GenericParams' },
        },
      },
      {},
    ),
    LanguageComponent.define(
      'PageDefinition',
      {
        type: 'object',
        properties: {
          blocks: { type: 'array', items: { $ref: '#/components/schemas/BlockDefinition' } },
        },
      },
      {},
    ),
    LanguageComponent.define(
      'AppDefinition',
      {
        type: 'object',
        properties: {
          pages: { type: 'array', items: { $ref: '#/components/schemas/PageDefinition' } },
        },
      },
      {},
    ),
  ]);
  const resolveFormParams: DynamicChild = (parentIdentity, parentValue, key) =>
    parentIdentity === 'BlockDefinition' && key === 'parameters' ? FormParams.schema : null;

  const identityNames = (tree: MountIndex): Record<string, string> =>
    Object.fromEntries([...tree.mounts].map(([path, mount]) => [path, mount.identity.name]));

  it('re-walks the resolver-chosen schema, matching a full analysis after an edit', () => {
    const ctx = LanguageCtx.compile(overrideSchemas, 'AppDefinition', {
      dynamicChild: resolveFormParams,
    });
    const v1 = {
      pages: [{ blocks: [{ type: 'form', version: '0.0.0', parameters: { fields: ['a'] } }] }],
    };
    const treeV1 = buildTree(ctx, v1);
    expect(treeV1.mounts.get('/pages/0/blocks/0/parameters')?.identity.name).toBe('FormParams');

    const v2 = {
      pages: [{ blocks: [{ type: 'form', version: '0.0.0', parameters: { fields: ['a', 'b'] } }] }],
    };
    const incremental = buildTree(ctx, v2, {
      previous: treeV1,
      changed: [['pages', 0, 'blocks', 0, 'parameters', 'fields']],
    });

    // A structural boundary would follow the generic `parameters` $ref and mount GenericParams
    // here, diverging from the full walk that resolves FormParams.
    expect(identityNames(incremental)).toStrictEqual(identityNames(buildTree(ctx, v2)));
    expect(incremental.mounts.get('/pages/0/blocks/0/parameters')?.identity.name).toBe(
      'FormParams',
    );
  });
});
