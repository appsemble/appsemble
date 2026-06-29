import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { annotateSchema, annotateSchemas, META_KEY, MetaAnalyzer } from './index.js';

describe('annotateSchema', () => {
  it('should tag an object schema with the given name and object mode', () => {
    const result = annotateSchema(
      { type: 'object', properties: { x: { type: 'string' } } },
      'Thing',
    );
    expect(result.appsembleMetaObject).toStrictEqual({ name: 'Thing', mode: 'object' });
  });

  it('should derive the combinator mode', () => {
    expect(annotateSchema({ oneOf: [] }, 'A').appsembleMetaObject).toStrictEqual({
      name: 'A',
      mode: 'oneOf',
    });
    expect(annotateSchema({ anyOf: [] }, 'A').appsembleMetaObject).toStrictEqual({
      name: 'A',
      mode: 'anyOf',
    });
    expect(annotateSchema({ allOf: [] }, 'A').appsembleMetaObject).toStrictEqual({
      name: 'A',
      mode: 'allOf',
    });
  });

  it('should leave scalar and already-tagged schemas untouched', () => {
    expect(annotateSchema({ type: 'string' }, 'S').appsembleMetaObject).toBeUndefined();
    const tagged: Schema = {
      type: 'object',
      appsembleMetaObject: { name: 'Kept', mode: 'object' },
    };
    expect(annotateSchema(tagged, 'Ignored').appsembleMetaObject).toStrictEqual({
      name: 'Kept',
      mode: 'object',
    });
  });

  it('should write the tag under a custom key', () => {
    const result = annotateSchema({ type: 'object' }, 'Thing', 'metaObject') as Record<
      string,
      unknown
    >;
    expect(result.metaObject).toStrictEqual({ name: 'Thing', mode: 'object' });
    expect(result.appsembleMetaObject).toBeUndefined();
  });
});

describe('annotateSchemas', () => {
  it('should tag each schema by its key and pass scalars through', () => {
    const result = annotateSchemas({
      Page: { type: 'object', properties: {} },
      Widget: { oneOf: [] },
      note: { type: 'string' },
    });
    expect(result.Page.appsembleMetaObject).toStrictEqual({ name: 'Page', mode: 'object' });
    expect(result.Widget.appsembleMetaObject).toStrictEqual({ name: 'Widget', mode: 'oneOf' });
    expect(result.note.appsembleMetaObject).toBeUndefined();
  });

  it('should make an otherwise-untagged schema graph analyzable', () => {
    const schemas = annotateSchemas({
      Root: { type: 'object', properties: { page: { $ref: '#/components/schemas/Page' } } },
      Page: { type: 'object', properties: { name: { type: 'string' } } },
    });
    const result = new MetaAnalyzer(schemas).analyze({ page: { name: 'Home' } }, schemas.Root);
    expect(result.interpretations.get('/')?.identity.name).toBe('Root');
    expect(result.interpretations.get('/page')?.identity.name).toBe('Page');
  });

  it('should honor a custom meta key end to end', () => {
    const raw = {
      Root: { type: 'object', properties: { page: { $ref: '#/components/schemas/Page' } } },
      Page: { type: 'object', properties: {} },
    };
    const schemas = annotateSchemas(raw, 'metaObject');
    // The analyzer reading the same custom key mounts identities.
    const matched = new MetaAnalyzer(schemas, 'metaObject').analyze({ page: {} }, schemas.Root);
    expect(matched.interpretations.get('/page')?.identity.name).toBe('Page');
    // The default key sees nothing, proving the key is actually threaded through.
    const missed = new MetaAnalyzer(schemas).analyze({ page: {} }, schemas.Root);
    expect(missed.interpretations.size).toBe(0);
  });

  it('should expose the default key as META_KEY', () => {
    expect(META_KEY).toBe('appsembleMetaObject');
  });
});
