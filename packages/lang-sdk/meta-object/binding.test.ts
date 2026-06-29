import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { defineMetaObject, metaBindings, metaSchemas } from './index.js';

describe('defineMetaObject', () => {
  // The mini-schema fixtures build every tag through defineMetaObject (obj/combinator delegate
  // to it), so these cases guard the tag-writing they rely on: mode inference from shape and
  // the object fallback.
  it('infers the tag mode from the schema shape', () => {
    const cases: [Schema, string][] = [
      [{ type: 'object' }, 'object'],
      [{ properties: {} }, 'object'],
      [{ oneOf: [] }, 'oneOf'],
      [{ anyOf: [] }, 'anyOf'],
      [{ allOf: [] }, 'allOf'],
    ];

    for (const [schema, mode] of cases) {
      expect(defineMetaObject('Tagged', schema, {}).schema.appsembleMetaObject).toStrictEqual({
        name: 'Tagged',
        mode,
      });
    }
  });

  it('falls back to object mode for a shape it cannot classify', () => {
    expect(
      defineMetaObject('Scalar', { type: 'string' }, {}).schema.appsembleMetaObject,
    ).toStrictEqual({ name: 'Scalar', mode: 'object' });
  });

  it('preserves an existing tag and writes new tags under a custom meta key', () => {
    const tagged = {
      type: 'object',
      metaObject: { name: 'AlreadyTagged', mode: 'object' },
    } as Schema & Record<string, unknown>;

    const preserved = defineMetaObject('Ignored', tagged, {}, 'metaObject');
    const custom = defineMetaObject('CustomTagged', { type: 'object' }, {}, 'metaObject');

    expect(preserved.schema).toBe(tagged);
    expect((preserved.schema as Record<string, unknown>).metaObject).toStrictEqual({
      name: 'AlreadyTagged',
      mode: 'object',
    });
    expect((custom.schema as Record<string, unknown>).metaObject).toStrictEqual({
      name: 'CustomTagged',
      mode: 'object',
    });
    expect(custom.schema.appsembleMetaObject).toBeUndefined();
  });
});

describe('metaSchemas / metaBindings', () => {
  it('builds a name-keyed schema registry from defs', () => {
    const defs = [
      defineMetaObject('Alpha', { type: 'object' }, {}),
      defineMetaObject('Beta', { oneOf: [] }, {}),
    ];

    const schemas = metaSchemas(defs);

    expect(Object.keys(schemas)).toStrictEqual(['Alpha', 'Beta']);
    expect(schemas.Alpha).toBe(defs[0].schema);
  });

  it('returns a name-keyed binding map preserving each binding object', () => {
    const first = { describe: () => 'first' };
    const second = { complete: () => ['second'] };
    const defs = [
      defineMetaObject('FirstBinding', { type: 'object' }, first),
      defineMetaObject('SecondBinding', { type: 'object' }, second),
    ];

    const bindings = metaBindings(defs);

    expect(bindings.get('FirstBinding')).toBe(first);
    expect(bindings.get('SecondBinding')).toBe(second);
  });
});
