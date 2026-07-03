import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { defineLanguageComponent, componentBindings, componentSchemas } from './index.js';

describe('defineLanguageComponent', () => {
  // The mini-schema fixtures build every tag through defineLanguageComponent (obj/combinator delegate
  // to it), so these cases guard the tag-writing they rely on: mode inference from shape and
  // the object fallback.
  it('infers the tag mode from the schema shape', () => {
    const cases: [Schema, string][] = [
      [{ type: 'object' }, 'single'],
      [{ properties: {} }, 'single'],
      [{ oneOf: [] }, 'oneOf'],
      [{ anyOf: [] }, 'anyOf'],
      [{ allOf: [] }, 'allOf'],
    ];

    for (const [schema, mode] of cases) {
      expect(
        defineLanguageComponent('Tagged', schema, {}).schema.appsembleLanguageComponent,
      ).toStrictEqual({
        name: 'Tagged',
        mode,
      });
    }
  });

  it('falls back to object mode for a shape it cannot classify', () => {
    expect(
      defineLanguageComponent('Scalar', { type: 'string' }, {}).schema.appsembleLanguageComponent,
    ).toStrictEqual({ name: 'Scalar', mode: 'single' });
  });

  it('preserves an existing tag and writes new tags under a custom meta key', () => {
    const tagged = {
      type: 'object',
      customKey: { name: 'AlreadyTagged', mode: 'single' },
    } as Schema & Record<string, unknown>;

    const preserved = defineLanguageComponent('Ignored', tagged, {}, 'customKey');
    const custom = defineLanguageComponent('CustomTagged', { type: 'object' }, {}, 'customKey');

    expect(preserved.schema).toBe(tagged);
    expect((preserved.schema as Record<string, unknown>).customKey).toStrictEqual({
      name: 'AlreadyTagged',
      mode: 'single',
    });
    expect((custom.schema as Record<string, unknown>).customKey).toStrictEqual({
      name: 'CustomTagged',
      mode: 'single',
    });
    expect(custom.schema.appsembleLanguageComponent).toBeUndefined();
  });
});

describe('componentSchemas / componentBindings', () => {
  it('builds a name-keyed schema registry from defs', () => {
    const defs = [
      defineLanguageComponent('Alpha', { type: 'object' }, {}),
      defineLanguageComponent('Beta', { oneOf: [] }, {}),
    ];

    const schemas = componentSchemas(defs);

    expect(Object.keys(schemas)).toStrictEqual(['Alpha', 'Beta']);
    expect(schemas.Alpha).toBe(defs[0].schema);
  });

  it('returns a name-keyed binding map preserving each binding object', () => {
    const first = { describe: () => 'first' };
    const second = { complete: () => ['second'] };
    const defs = [
      defineLanguageComponent('FirstBinding', { type: 'object' }, first),
      defineLanguageComponent('SecondBinding', { type: 'object' }, second),
    ];

    const bindings = componentBindings(defs);

    expect(bindings.get('FirstBinding')).toBe(first);
    expect(bindings.get('SecondBinding')).toBe(second);
  });
});
