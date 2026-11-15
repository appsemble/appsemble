import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { LanguageComponent, LanguageCtx, scan } from './index.js';

/*
 * Blocks prototype: one approach (a materialized discriminated oneOf), zero engine changes.
 * Block parameters live in per-block schemas, not the static schema. Hand-building a
 * BlockDefinition.allOf = [{ oneOf: [ per-block branch discriminated by `type` ] }] with
 * `parameters` pointing at that block's materialized schema, the walk resolves the
 * discriminated oneOf and mounts the block's parameters as language components.
 *
 * This is a prototype: it hand-builds one block branch and one materialized param schema in
 * place of the async manifest fetch. It is NOT the engine handling blocks natively, and it is
 * not the shape the LSP now assembles (an allOf of per-block if/then branches, which the walk
 * cannot navigate -- see BLOCKS.md). blocks-dynamic.test.ts covers the resolver-hook approach
 * (Approach B) the engine actually grows for blocks.
 *
 * The param schema is keyed by its real block URL (the scheme the LSP block schema request
 * service serves) and $ref'd by that URL -- exercising the URL-aware registry, not a synthetic
 * #/components/schemas name.
 */
const formParamsUrl = 'appsemble://blocks/@appsemble/form/0.0.0/parameters.json';

const FormParams = LanguageComponent.define(
  'FormParams',
  { type: 'object', properties: { fields: { type: 'array' } } },
  {},
);

const BlockDefinition = LanguageComponent.define(
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
  ...LanguageComponent.schemas([
    BlockDefinition,
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
  ]),
  // Block param schema registered under its real URL, resolved by the URL-aware registry.
  [formParamsUrl]: FormParams.schema,
};

describe('blocks prototype (a materialized discriminated oneOf)', () => {
  it('should mount a block parameters language component via the discriminated oneOf', () => {
    const app = { pages: [{ blocks: [{ type: 'form', parameters: { fields: [] } }] }] };
    const result = scan(LanguageCtx.compile(schemas, 'AppDefinition'), app);

    expect(result.mounts.get('/pages/0/blocks/0')?.identity.name).toBe('BlockDefinition');
    // The block's parameters resolved to the form block's schema and mounted.
    expect(result.mounts.get('/pages/0/blocks/0/parameters')?.identity.name).toBe('FormParams');
  });
});
