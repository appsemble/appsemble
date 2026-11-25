import { describe, expect, it } from 'vitest';

import { blockActionsSchema, blockEventsSchema, blockParametersSchema } from './blockRegistry.js';
import { type BlockManifest } from './types/index.js';

/*
 * Pure manifest→schema derivations. lang-sdk owns these (side-effect-free) so both the GUI editor and
 * the LSP synthesize the same actions/events schemas from a block manifest; the fetch/cache adapter that
 * produces the manifest is the consumer's.
 */

function manifest(partial: Partial<BlockManifest>): BlockManifest {
  return {
    name: '@org/test',
    version: '0.0.0',
    files: [],
    languages: null,
    ...partial,
  } as BlockManifest;
}

describe('block manifest derivations', () => {
  it('passes parameters through, null when absent', () => {
    const params = { type: 'object', properties: { url: { type: 'string' } } };
    expect(blockParametersSchema(manifest({ parameters: params }))).toStrictEqual(params);
    expect(blockParametersSchema(manifest({}))).toBeNull();
  });

  it('synthesizes a closed actions object with a slot per declared action', () => {
    const schema = blockActionsSchema(
      manifest({ actions: { onClick: { description: 'clicked' }, onLoad: {} } }),
    );
    expect(schema.type).toBe('object');
    expect(schema.additionalProperties).toBe(false);
    expect(Object.keys(schema.properties!)).toStrictEqual(['onClick', 'onLoad']);
    expect((schema.properties!.onClick as { description: string }).description).toBe('clicked');
  });

  it('opens additionalProperties for a $any action', () => {
    const schema = blockActionsSchema(manifest({ actions: { $any: { description: 'any' } } }));
    expect(schema.additionalProperties).toStrictEqual({ type: 'object', description: 'any' });
    expect(schema.properties).toStrictEqual({});
  });

  it('is empty when the block declares no actions', () => {
    expect(blockActionsSchema(manifest({}))).toStrictEqual({});
  });

  it('synthesizes emit/listen event slots, opening listen.$any', () => {
    const schema = blockEventsSchema(
      manifest({
        events: {
          emit: { data: { description: 'emits data' } },
          listen: { refresh: {}, $any: {} },
        },
      }),
    );
    const props = schema.properties as Record<
      string,
      { properties?: Record<string, unknown>; additionalProperties?: unknown }
    >;
    expect(Object.keys(props.emit.properties!)).toStrictEqual(['data']);
    expect(Object.keys(props.listen.properties!)).toStrictEqual(['refresh']);
    expect(props.listen.additionalProperties).toStrictEqual({
      type: 'string',
      description: 'Any event',
    });
  });

  it('is empty when the block declares no events', () => {
    expect(blockEventsSchema(manifest({}))).toStrictEqual({});
  });
});
