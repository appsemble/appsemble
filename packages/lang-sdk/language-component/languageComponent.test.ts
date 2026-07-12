import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { LanguageComponent } from './index.js';

describe('LanguageComponent.define', () => {
  // The stress-test fixtures build every tag through LanguageComponent.define (obj/combinator delegate
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
        LanguageComponent.define('Tagged', schema, {}).schema.appsembleLanguageComponent,
      ).toStrictEqual({
        name: 'Tagged',
        mode,
      });
    }
  });

  it('falls back to object mode for a shape it cannot classify', () => {
    expect(
      LanguageComponent.define('Scalar', { type: 'string' }, {}).schema.appsembleLanguageComponent,
    ).toStrictEqual({ name: 'Scalar', mode: 'single' });
  });

  it('preserves an existing tag untouched', () => {
    const tagged: Schema = {
      type: 'object',
      appsembleLanguageComponent: { name: 'AlreadyTagged', mode: 'single' },
    };

    const preserved = LanguageComponent.define('Ignored', tagged, {});

    expect(preserved.schema).toBe(tagged);
    expect(preserved.schema.appsembleLanguageComponent).toStrictEqual({
      name: 'AlreadyTagged',
      mode: 'single',
    });
  });
});

describe('LanguageComponent.schemas / LanguageComponent.bindings', () => {
  it('builds a name-keyed schema registry from defs', () => {
    const defs = [
      LanguageComponent.define('Alpha', { type: 'object' }, {}),
      LanguageComponent.define('Beta', { oneOf: [] }, {}),
    ];

    const schemas = LanguageComponent.schemas(defs);

    expect(Object.keys(schemas)).toStrictEqual(['Alpha', 'Beta']);
    expect(schemas.Alpha).toBe(defs[0].schema);
  });

  it('returns a name-keyed binding map preserving each binding object', () => {
    const first = { describe: () => 'first' };
    const second = { complete: () => ['second'] };
    const defs = [
      LanguageComponent.define('FirstBinding', { type: 'object' }, first),
      LanguageComponent.define('SecondBinding', { type: 'object' }, second),
    ];

    const bindings = LanguageComponent.bindings(defs);

    expect(bindings.get('FirstBinding')).toBe(first);
    expect(bindings.get('SecondBinding')).toBe(second);
  });
});

describe('LanguageComponent.annotate', () => {
  it('bulk-tags a registry by key so an untagged schema set mounts identities', () => {
    const annotated = LanguageComponent.annotate({
      Page: { type: 'object', properties: {} },
      Name: { type: 'string' },
    });

    // Object schemas become language components keyed by their registry name.
    expect(annotated.Page.appsembleLanguageComponent).toStrictEqual({
      name: 'Page',
      mode: 'single',
    });
    // Scalars are left untagged.
    expect(annotated.Name.appsembleLanguageComponent).toBeUndefined();
  });
});
