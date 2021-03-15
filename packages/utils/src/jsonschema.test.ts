import { generateDataFromSchema } from './jsonschema';

describe('generateDataFromSchema', () => {
  it('should not crash if no schema is defined', () => {
    const result = generateDataFromSchema();
    expect(result).toBeUndefined();
  });

  it('should return the default value', () => {
    const result = generateDataFromSchema({ type: 'string', default: 'foo' });
    expect(result).toBe('foo');
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
