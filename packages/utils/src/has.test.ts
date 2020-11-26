import { has } from './has';

describe('has', () => {
  it('should return false for null targets', () => {
    expect(has(null, '__proto__')).toBe(false);
  });

  it('should return false for undefined targets', () => {
    expect(has(undefined, '__proto__')).toBe(false);
  });

  it('should return false for attributes inferred from the prototype chain', () => {
    expect(has({}, '__proto__')).toBe(false);
  });

  it('should return true for own properties', () => {
    expect(has({ __proto__: null }, '__proto__')).toBe(true);
  });
});
