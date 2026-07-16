import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { LanguageComponent, LanguageCtx, scan } from './index.js';

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
  it('tags objects and combinators by key while passing scalars and tagged schemas through', () => {
    const tagged: Schema = {
      type: 'object',
      appsembleLanguageComponent: { name: 'Kept', mode: 'single' },
    };
    const annotated = LanguageComponent.annotate({
      Page: { type: 'object', properties: {} },
      Widget: { oneOf: [] },
      Name: { type: 'string' },
      Existing: tagged,
    });

    expect(annotated.Page.appsembleLanguageComponent).toStrictEqual({
      name: 'Page',
      mode: 'single',
    });
    expect(annotated.Widget.appsembleLanguageComponent).toStrictEqual({
      name: 'Widget',
      mode: 'oneOf',
    });
    expect(annotated.Name.appsembleLanguageComponent).toBeUndefined();
    // An already-tagged schema keeps its name, even when the registry key differs.
    expect(annotated.Existing.appsembleLanguageComponent).toStrictEqual({
      name: 'Kept',
      mode: 'single',
    });
  });

  it('makes an otherwise-untagged schema graph analyzable', () => {
    const schemas = LanguageComponent.annotate({
      Root: { type: 'object', properties: { page: { $ref: '#/components/schemas/Page' } } },
      Page: { type: 'object', properties: { name: { type: 'string' } } },
    });

    const result = scan(LanguageCtx.compile(schemas, 'Root'), { page: { name: 'Home' } });

    expect(result.mounts.get('/')?.identity.name).toBe('Root');
    expect(result.mounts.get('/page')?.identity.name).toBe('Page');
  });
});
