import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import {
  type DynamicChild,
  LanguageComponent,
  LanguageCtx,
  type LoadDynamicChild,
  scan,
  scanAsync,
} from './index.js';

/*
 * Async descent (language-component/BLOCKS.md): resolving a value-directed child stays sync
 * (`dynamicChild`), while *loading* what it reads is a separate async hook (`loadDynamicChild`) the
 * async walk (`scanAsync`) / cursor (`childAsync`) awaits inline, one child at a time — never a
 * prime-everything-first pass. A block manifest arrives exactly when the walk reaches that block.
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

const manifests = new Map<string, Schema>([
  ['form@0.0.0', FormParams.schema],
  ['table@0.0.0', TableParams.schema],
]);

const schemas: Record<string, Schema> = LanguageComponent.schemas([
  // `parameters` is deliberately absent from the schema: only the resolver can reach it.
  LanguageComponent.define(
    'BlockDefinition',
    { type: 'object', properties: { type: { type: 'string' }, version: { type: 'string' } } },
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

// A lazily-populated cache: `dynamicChild` reads it synchronously; it starts empty and only the
// async `loadDynamicChild` (simulating a fetch) fills it, per block, as the walk reaches each.
function makeHooks(): {
  dynamicChild: DynamicChild;
  loadDynamicChild: LoadDynamicChild;
  loadedOrder: string[];
} {
  const cache = new Map<string, Schema>();
  const loadedOrder: string[] = [];
  const keyOf = (value: unknown): string | null => {
    const block = value as { type?: string; version?: string };
    return block.type && block.version ? `${block.type}@${block.version}` : null;
  };
  return {
    loadedOrder,
    dynamicChild(parentIdentity, parentValue, key) {
      if (parentIdentity !== 'BlockDefinition' || key !== 'parameters') {
        return null;
      }
      const id = keyOf(parentValue);
      return id ? (cache.get(id) ?? null) : null;
    },
    async loadDynamicChild(parentIdentity, parentValue, key) {
      if (parentIdentity !== 'BlockDefinition' || key !== 'parameters') {
        return;
      }
      const id = keyOf(parentValue);
      if (!id || cache.has(id)) {
        return;
      }
      await Promise.resolve();
      const manifest = manifests.get(id);
      if (manifest) {
        cache.set(id, manifest);
        loadedOrder.push(id);
      }
    },
  };
}

describe('async descent loads value-directed children inline', () => {
  it('does not mount parameters synchronously — the cache is still empty', () => {
    const { dynamicChild } = makeHooks();
    const result = scan(LanguageCtx.compile(schemas, 'AppDefinition', { dynamicChild }), app);

    expect(result.mounts.get('/pages/0/blocks/0')?.identity.name).toBe('BlockDefinition');
    expect(result.mounts.has('/pages/0/blocks/0/parameters')).toBe(false);
  });

  it('scanAsync awaits each load inline and mounts the resolved parameters', async () => {
    const { dynamicChild, loadDynamicChild, loadedOrder } = makeHooks();
    const result = await scanAsync(
      LanguageCtx.compile(schemas, 'AppDefinition', { dynamicChild, loadDynamicChild }),
      app,
    );

    expect(result.mounts.get('/pages/0/blocks/0/parameters')?.identity.name).toBe('FormParams');
    expect(result.mounts.get('/pages/0/blocks/1/parameters')?.identity.name).toBe('TableParams');
    // Loaded lazily in walk order (block 0 before block 1), not primed all up front.
    expect(loadedOrder).toStrictEqual(['form@0.0.0', 'table@0.0.0']);
  });

  it('childAsync loads then resolves the child, where sync child sees nothing yet', async () => {
    const { dynamicChild, loadDynamicChild } = makeHooks();
    const block = LanguageCtx.compile(schemas, 'AppDefinition', { dynamicChild, loadDynamicChild })
      .root(app)
      .cursorAt(['pages', 0, 'blocks', 0]);

    expect(block?.child('parameters')).toBeNull();
    const params = await block?.childAsync('parameters');
    expect(params?.identity?.name).toBe('FormParams');
  });
});
