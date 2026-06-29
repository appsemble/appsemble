import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { analyzeMetaObjects, defineMetaObject, metaSchemas } from './index.js';

/*
 * Blocks prototype (Approach A in meta-object/BLOCKS.md), zero engine changes. Block
 * parameters live in per-block schemas, not the static schema. Modelling the LSP's shape
 * -- BlockDefinition.allOf = [{ oneOf: [ per-block branch discriminated by `type` ] }] with
 * `parameters` pointing at that block's (materialized) schema -- the walk resolves the
 * discriminated oneOf and mounts the block's parameters as meta-objects.
 *
 * This is a prototype: it hand-builds one block branch and one materialized param schema in
 * place of the async manifest fetch. It is NOT the engine handling blocks natively.
 *
 * The param schema is keyed by its real block URL (the scheme the LSP block schema request
 * service serves) and $ref'd by that URL -- exercising the URL-aware registry, not a synthetic
 * #/components/schemas name.
 */
const formParamsUrl = 'appsemble://blocks/@appsemble/form/0.0.0/parameters.json';

const FormParams = defineMetaObject(
  'FormParams',
  { type: 'object', properties: { fields: { type: 'array' } } },
  {},
);

const BlockDefinition = defineMetaObject(
  'BlockDefinition',
  {
    type: 'object',
    properties: { type: { type: 'string' }, version: { type: 'string' } },
    // The LSP shape: a oneOf of per-block branches, discriminated by `type`, each pointing
    // `parameters` at that block's materialized schema by its block URL.
    allOf: [
      {
        oneOf: [
          {
            properties: {
              type: { const: 'form' },
              parameters: { $ref: formParamsUrl },
            },
          },
        ],
      },
    ],
  },
  {},
);

const schemas: Record<string, Schema> = {
  ...metaSchemas([
    BlockDefinition,
    defineMetaObject(
      'PageDefinition',
      {
        type: 'object',
        properties: {
          blocks: { type: 'array', items: { $ref: '#/components/schemas/BlockDefinition' } },
        },
      },
      {},
    ),
    defineMetaObject(
      'AppDefinition',
      {
        type: 'object',
        properties: {
          pages: { type: 'array', items: { $ref: '#/components/schemas/PageDefinition' } },
        },
      },
      {},
    ),
  ]),
  // Block param schema registered under its real URL, resolved by the URL-aware registry.
  [formParamsUrl]: FormParams.schema,
};

describe('blocks prototype (Approach A: materialized discriminated oneOf)', () => {
  it('should mount a block parameters meta-object via the discriminated oneOf', () => {
    const app = { pages: [{ blocks: [{ type: 'form', parameters: { fields: [] } }] }] };
    const result = analyzeMetaObjects(app, schemas.AppDefinition, schemas);

    expect(result.interpretations.get('/pages/0/blocks/0')?.identity.name).toBe('BlockDefinition');
    // The block's parameters resolved to the form block's schema and mounted.
    expect(result.interpretations.get('/pages/0/blocks/0/parameters')?.identity.name).toBe(
      'FormParams',
    );
  });
});
