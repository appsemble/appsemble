import { describe, expect, it, vi } from 'vitest';

import { combineSchemas, generateDataFromSchema, iterJSONSchema } from './jsonschema.js';

describe('generateDataFromSchema', () => {
  it('should not crash if no schema is defined', () => {
    const result = generateDataFromSchema();
    expect(result).toBeNull();
  });

  it('should return the default value', () => {
    const result = generateDataFromSchema({ type: 'string', default: 'pear' });
    expect(result).toBe('pear');
  });

  describe('array', () => {
    it('should return an empty array', () => {
      const result = generateDataFromSchema({ type: 'array' });
      expect(result).toStrictEqual([]);
    });

    it('should fill the array up to minItems', () => {
      const result = generateDataFromSchema({
        type: 'array',
        minItems: 3,
        items: { type: 'string' },
      });
      expect(result).toStrictEqual(['', '', '']);
    });

    it('should use indexed array items if it’s an array', () => {
      const result = generateDataFromSchema({
        type: 'array',
        minItems: 3,
        items: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }],
      });
      expect(result).toStrictEqual([false, 0, '']);
    });

    it('should use use additionalItems if the array length', () => {
      const result = generateDataFromSchema({
        type: 'array',
        minItems: 3,
        items: [{ type: 'boolean' }],
        additionalItems: { type: 'string' },
      });
      expect(result).toStrictEqual([false, '', '']);
    });
  });

  describe('boolean', () => {
    it('should return false', () => {
      const result = generateDataFromSchema({ type: 'boolean' });
      expect(result).toBe(false);
    });
  });

  describe('integer / number', () => {
    it('should return 0', () => {
      const result = generateDataFromSchema({ type: 'number' });
      expect(result).toBe(0);
    });

    it('should respect the minimum value', () => {
      const result = generateDataFromSchema({ type: 'number', minimum: 5 });
      expect(result).toBe(5);
    });

    it('should respect the maximum value', () => {
      const result = generateDataFromSchema({ type: 'number', maximum: -5 });
      expect(result).toBe(-5);
    });

    it('should respect the combination of multipleOf and minimum', () => {
      const result = generateDataFromSchema({ type: 'number', minimum: 5, multipleOf: 3 });
      expect(result).toBe(6);
    });

    it('should respect the combination of multipleOf and maximum', () => {
      const result = generateDataFromSchema({ type: 'number', maximum: -5, multipleOf: 3 });
      expect(result).toBe(-6);
    });
  });

  describe('null', () => {
    it('should return null', () => {
      const result = generateDataFromSchema({ type: 'null' });
      expect(result).toBeNull();
    });
  });

  describe('string', () => {
    it('should return an empty string', () => {
      const result = generateDataFromSchema({ type: 'string' });
      expect(result).toBe('');
    });
  });

  describe('object', () => {
    it('should recursively create an object', () => {
      const result = generateDataFromSchema({
        type: 'object',
        properties: { bool: { type: 'boolean' }, num: { type: 'number' }, str: { type: 'string' } },
      });
      expect(result).toStrictEqual({ bool: false, num: 0, str: '' });
    });
  });
});

describe('combineSchemas', () => {
  it('should use the first type found', () => {
    const result = combineSchemas({ type: 'number' }, { type: 'string' });
    expect(result).toStrictEqual({ type: 'number' });
  });

  it('should use the first format found', () => {
    const result = combineSchemas({ format: 'email' }, { format: 'uuid' });
    expect(result).toStrictEqual({ format: 'email' });
  });

  it('should determine the minimum', () => {
    const result = combineSchemas({}, { minimum: 3 }, { minimum: 1 }, { minimum: 2 }, {});
    expect(result).toStrictEqual({ minimum: 3 });
  });

  it('should determine the min length', () => {
    const result = combineSchemas({}, { minLength: 3 }, { minLength: 1 }, { minLength: 2 }, {});
    expect(result).toStrictEqual({ minLength: 3 });
  });

  it('should determine the maximum', () => {
    const result = combineSchemas({}, { maximum: 3 }, { maximum: 1 }, { maximum: 2 }, {});
    expect(result).toStrictEqual({ maximum: 1 });
  });

  it('should determine the max length', () => {
    const result = combineSchemas({}, { maxLength: 3 }, { maxLength: 1 }, { maxLength: 2 }, {});
    expect(result).toStrictEqual({ maxLength: 1 });
  });

  it('should use the least common multiple for multipleOf', () => {
    const result = combineSchemas({}, { multipleOf: 0 }, { multipleOf: 6 }, { multipleOf: 8 }, {});
    expect(result).toStrictEqual({ multipleOf: 24 });
  });

  it('should assign the first non-nullish default', () => {
    const result = combineSchemas({}, { default: null }, { default: 'a' }, { default: 'b' }, {});
    expect(result).toStrictEqual({ default: 'a' });
  });

  it('should use the first truthy description', () => {
    const result = combineSchemas(
      {},
      { description: '' },
      { description: 'Hi' },
      { description: 'Bye' },
      {},
    );
    expect(result).toStrictEqual({ description: 'Hi' });
  });

  it('should use the first truthy title', () => {
    const result = combineSchemas({}, { title: '' }, { title: 'Hi' }, { title: 'Bye' }, {});
    expect(result).toStrictEqual({ title: 'Hi' });
  });

  it('should set uniqueItems to true if any schema requires this', () => {
    const result = combineSchemas({}, { uniqueItems: false }, { uniqueItems: true }, {});
    expect(result).toStrictEqual({ uniqueItems: true });
  });

  it('should merge required arrays', () => {
    const result = combineSchemas({}, { required: ['foo'] }, { required: ['bar'] }, {});
    expect(result).toStrictEqual({ required: ['foo', 'bar'] });
  });

  it('should assign required if it’s true', () => {
    const result = combineSchemas({}, { required: true }, { required: false }, {});
    expect(result).toStrictEqual({ required: true });
  });

  it('should merge properties', () => {
    const result = combineSchemas(
      {},
      { properties: { foo: { type: 'string' } } },
      { properties: { bar: { type: 'number' } } },
      { properties: { foo: { title: 'Foo' }, bar: { title: 'Bar' } } },
      { required: ['foo', 'bar'] },
      {},
    );
    expect(result).toStrictEqual({
      required: ['foo', 'bar'],
      properties: {
        foo: {
          title: 'Foo',
          type: 'string',
        },
        bar: {
          title: 'Bar',
          type: 'number',
        },
      },
    });
  });
});

describe('iterJSONSchema', () => {
  it('should handle properties', () => {
    const onSchema = vi.fn();
    const schema = {
      type: 'object',
      properties: {
        foo: { description: 'foo' },
      },
    };

    iterJSONSchema(schema, onSchema);

    expect(onSchema).toHaveBeenCalledTimes(2);
    expect(onSchema).toHaveBeenCalledWith(schema);
    expect(onSchema).toHaveBeenCalledWith(schema.properties.foo);
  });

  it('should handle additionalProperties', () => {
    const onSchema = vi.fn();
    const schema = {
      type: 'object',
      additionalProperties: { description: 'foo' },
    };

    iterJSONSchema(schema, onSchema);

    expect(onSchema).toHaveBeenCalledTimes(2);
    expect(onSchema).toHaveBeenCalledWith(schema);
    expect(onSchema).toHaveBeenCalledWith(schema.additionalProperties);
  });

  it('should handle an items object', () => {
    const onSchema = vi.fn();
    const schema = {
      type: 'array',
      items: { description: 'foo' },
    };

    iterJSONSchema(schema, onSchema);

    expect(onSchema).toHaveBeenCalledTimes(2);
    expect(onSchema).toHaveBeenCalledWith(schema);
    expect(onSchema).toHaveBeenCalledWith(schema.items);
  });

  it('should handle an items array', () => {
    const onSchema = vi.fn();
    const schema = {
      type: 'array',
      items: [{ description: 'foo' }, { description: 'bar' }],
    };

    iterJSONSchema(schema, onSchema);

    expect(onSchema).toHaveBeenCalledTimes(3);
    expect(onSchema).toHaveBeenCalledWith(schema);
    expect(onSchema).toHaveBeenCalledWith(schema.items[0]);
    expect(onSchema).toHaveBeenCalledWith(schema.items[1]);
  });

  it('should handle additionalItems', () => {
    const onSchema = vi.fn();
    const schema = {
      type: 'array',
      additionalItems: { description: 'foo' },
    };

    iterJSONSchema(schema, onSchema);

    expect(onSchema).toHaveBeenCalledTimes(2);
    expect(onSchema).toHaveBeenCalledWith(schema);
    expect(onSchema).toHaveBeenCalledWith(schema.additionalItems);
  });

  it('should handle anyOf', () => {
    const onSchema = vi.fn();
    const schema = {
      type: 'array',
      anyOf: [{ description: 'foo' }],
    };

    iterJSONSchema(schema, onSchema);

    expect(onSchema).toHaveBeenCalledTimes(2);
    expect(onSchema).toHaveBeenCalledWith(schema);
    expect(onSchema).toHaveBeenCalledWith(schema.anyOf[0]);
  });

  it('should handle oneOf', () => {
    const onSchema = vi.fn();
    const schema = {
      type: 'array',
      oneOf: [{ description: 'foo' }],
    };

    iterJSONSchema(schema, onSchema);

    expect(onSchema).toHaveBeenCalledTimes(2);
    expect(onSchema).toHaveBeenCalledWith(schema);
    expect(onSchema).toHaveBeenCalledWith(schema.oneOf[0]);
  });

  it('should handle allOf', () => {
    const onSchema = vi.fn();
    const schema = {
      type: 'array',
      allOf: [{ description: 'foo' }],
    };

    iterJSONSchema(schema, onSchema);

    expect(onSchema).toHaveBeenCalledTimes(2);
    expect(onSchema).toHaveBeenCalledWith(schema);
    expect(onSchema).toHaveBeenCalledWith(schema.allOf[0]);
  });
});
