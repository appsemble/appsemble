import { has } from './has';

describe('has', () => {
  it('should return false for null targets', () => {
    expect(has(null, 'toString')).toBe(false);
  });

  it('should return false for undefined targets', () => {
    expect(has(undefined, 'toString')).toBe(false);
  });

  it('should return false for attributes inferred from the prototype chain', () => {
    expect(has({}, 'toString')).toBe(false);
  });

  it('should return true for own properties', () => {
    expect(has({ toString: null }, 'toString')).toBe(true);
  });
});
