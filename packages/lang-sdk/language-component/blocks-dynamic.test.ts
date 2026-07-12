import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { Cursor, type DynamicChild, LanguageComponent, Scanner } from './index.js';

/*
 * Blocks via the value-directed resolver (Approach B in language-component/BLOCKS.md).
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

describe('blocks via value-directed resolver (Approach B)', () => {
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
    const result = new Scanner(schemas, { dynamicChild: resolveBlockChild }).scan(
      app,
      schemas.AppDefinition,
    );

    expect(result.mounts.get('/pages/0/blocks/0')?.identity.name).toBe('BlockDefinition');
    // Each block's parameters resolve to a different schema, chosen by its own type+version.
    expect(result.mounts.get('/pages/0/blocks/0/parameters')?.identity.name).toBe('FormParams');
    expect(result.mounts.get('/pages/0/blocks/1/parameters')?.identity.name).toBe('TableParams');
  });

  it('mounts nothing under parameters without the resolver, proving the schema carries no union', () => {
    const app = { pages: [{ blocks: [{ type: 'form', version: '0.0.0', parameters: {} }] }] };
    const result = new Scanner(schemas).scan(app, schemas.AppDefinition);

    expect(result.mounts.get('/pages/0/blocks/0')?.identity.name).toBe('BlockDefinition');
    expect(result.mounts.has('/pages/0/blocks/0/parameters')).toBe(false);
  });

  it('descends the resolved child through a cursor identically to the walk', () => {
    const app = { pages: [{ blocks: [{ type: 'form', version: '0.0.0', parameters: {} }] }] };
    const params = Cursor.at(schemas, schemas.AppDefinition, app, {
      dynamicChild: resolveBlockChild,
    })
      .child('pages')
      ?.child(0)
      ?.child('blocks')
      ?.child(0)
      ?.child('parameters');

    expect(params?.identity?.name).toBe('FormParams');
  });
});
