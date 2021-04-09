import { findMessageIds } from './appMessages';

describe('findMessageIds', () => {
  it('should ignore null', () => {
    const result = findMessageIds(null);
    expect(result).toStrictEqual([]);
  });

  it('should ignore non-object values', () => {
    const result = findMessageIds('A string');
    expect(result).toStrictEqual([]);
  });

  it('should find message ids from a string.format remapper', () => {
    const result = findMessageIds({ 'string.format': { messageId: 'foo' } });
    expect(result).toStrictEqual(['foo']);
  });

  it('should ignore non-string message ids', () => {
    const result = findMessageIds({ 'string.format': { messageId: 12 } });
    expect(result).toStrictEqual([]);
  });

  it('should missing message ids', () => {
    const result = findMessageIds({ 'string.format': {} });
    expect(result).toStrictEqual([]);
  });

  it('should recurse into arrays', () => {
    const result = findMessageIds([
      { 'string.format': { messageId: 'foo' } },
      { 'string.format': { messageId: 'bar' } },
    ]);
    expect(result).toStrictEqual(['foo', 'bar']);
  });

  it('should recurse into objects', () => {
    const result = findMessageIds({
      foo: { 'string.format': { messageId: 'fooz' } },
      bar: { 'string.format': { messageId: 'baz' } },
    });
    expect(result).toStrictEqual(['fooz', 'baz']);
  });
});
