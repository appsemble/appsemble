import { Validator } from 'jsonschema';
import { describe, expect, it } from 'vitest';

import { skipBaseResolutionForSchemasWithoutId } from './jsonschemaBaseResolution.js';

skipBaseResolutionForSchemasWithoutId();

describe('skipBaseResolutionForSchemasWithoutId', () => {
  it('should resolve relative references against the base declared by an ancestor id', () => {
    const validator = new Validator();
    validator.addSchema({ type: 'string' }, 'http://example.com/name.json');

    const result = validator.validate(
      { name: 42 },
      {
        id: 'http://example.com/root.json',
        type: 'object',
        properties: { name: { $ref: 'name.json' } },
      },
    );

    expect(result.errors.map((error) => error.stack)).toStrictEqual([
      'instance.name is not of a type(s) string',
    ]);
  });

  it('should rebase relative references on an id declared by a nested schema', () => {
    const validator = new Validator();
    validator.addSchema({ type: 'string' }, 'http://example.com/sub/value.json');

    const result = validator.validate(
      { nested: { value: 42 } },
      {
        id: 'http://example.com/root.json',
        type: 'object',
        properties: {
          nested: {
            id: 'sub/',
            type: 'object',
            properties: { value: { $ref: 'value.json' } },
          },
        },
      },
    );

    expect(result.errors.map((error) => error.stack)).toStrictEqual([
      'instance.nested.value is not of a type(s) string',
    ]);
  });

  it('should report property paths for schemas that declare no id', () => {
    const validator = new Validator();

    const result = validator.validate(
      { pages: [{ blocks: [{ type: 1 }] }] },
      {
        type: 'object',
        properties: {
          pages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                blocks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { type: { type: 'string' } },
                    required: ['version'],
                  },
                },
              },
            },
          },
        },
      },
    );

    expect(result.errors.map((error) => error.stack)).toStrictEqual([
      'instance.pages[0].blocks[0].type is not of a type(s) string',
      'instance.pages[0].blocks[0] requires property "version"',
    ]);
  });
});
