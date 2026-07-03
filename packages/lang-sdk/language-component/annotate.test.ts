import { type Schema } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { annotateSchema, annotateSchemas, COMPONENT_KEY, Scanner } from './index.js';

describe('annotateSchema', () => {
  it('should tag an object schema with the given name and object mode', () => {
    const result = annotateSchema(
      { type: 'object', properties: { x: { type: 'string' } } },
      'Thing',
    );
    expect(result.appsembleLanguageComponent).toStrictEqual({ name: 'Thing', mode: 'single' });
  });

  it('should derive the combinator mode', () => {
    expect(annotateSchema({ oneOf: [] }, 'A').appsembleLanguageComponent).toStrictEqual({
      name: 'A',
      mode: 'oneOf',
    });
    expect(annotateSchema({ anyOf: [] }, 'A').appsembleLanguageComponent).toStrictEqual({
      name: 'A',
      mode: 'anyOf',
    });
    expect(annotateSchema({ allOf: [] }, 'A').appsembleLanguageComponent).toStrictEqual({
      name: 'A',
      mode: 'allOf',
    });
  });

  it('should leave scalar and already-tagged schemas untouched', () => {
    expect(annotateSchema({ type: 'string' }, 'S').appsembleLanguageComponent).toBeUndefined();
    const tagged: Schema = {
      type: 'object',
      appsembleLanguageComponent: { name: 'Kept', mode: 'single' },
    };
    expect(annotateSchema(tagged, 'Ignored').appsembleLanguageComponent).toStrictEqual({
      name: 'Kept',
      mode: 'single',
    });
  });

  it('should write the tag under a custom key', () => {
    const result = annotateSchema({ type: 'object' }, 'Thing', 'customKey') as Record<
      string,
      unknown
    >;
    expect(result.customKey).toStrictEqual({ name: 'Thing', mode: 'single' });
    expect(result.appsembleLanguageComponent).toBeUndefined();
  });
});

describe('annotateSchemas', () => {
  it('should tag each schema by its key and pass scalars through', () => {
    const result = annotateSchemas({
      Page: { type: 'object', properties: {} },
      Widget: { oneOf: [] },
      note: { type: 'string' },
    });
    expect(result.Page.appsembleLanguageComponent).toStrictEqual({ name: 'Page', mode: 'single' });
    expect(result.Widget.appsembleLanguageComponent).toStrictEqual({
      name: 'Widget',
      mode: 'oneOf',
    });
    expect(result.note.appsembleLanguageComponent).toBeUndefined();
  });

  it('should make an otherwise-untagged schema graph analyzable', () => {
    const schemas = annotateSchemas({
      Root: { type: 'object', properties: { page: { $ref: '#/components/schemas/Page' } } },
      Page: { type: 'object', properties: { name: { type: 'string' } } },
    });
    const result = new Scanner(schemas).scan({ page: { name: 'Home' } }, schemas.Root);
    expect(result.interpretations.get('/')?.identity.name).toBe('Root');
    expect(result.interpretations.get('/page')?.identity.name).toBe('Page');
  });

  it('should honor a custom meta key end to end', () => {
    const raw = {
      Root: { type: 'object', properties: { page: { $ref: '#/components/schemas/Page' } } },
      Page: { type: 'object', properties: {} },
    };
    const schemas = annotateSchemas(raw, 'customKey');
    // The analyzer reading the same custom key mounts identities.
    const matched = new Scanner(schemas, 'customKey').scan({ page: {} }, schemas.Root);
    expect(matched.interpretations.get('/page')?.identity.name).toBe('Page');
    // The default key sees nothing, proving the key is actually threaded through.
    const missed = new Scanner(schemas).scan({ page: {} }, schemas.Root);
    expect(missed.interpretations.size).toBe(0);
  });

  it('should expose the default key as COMPONENT_KEY', () => {
    expect(COMPONENT_KEY).toBe('appsembleLanguageComponent');
  });
});
