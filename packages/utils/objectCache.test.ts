import { objectCache } from './objectCache.js';

describe('objectCache', () => {
  it('should cache reslts', () => {
    let count = 0;
    const cache = objectCache((id) => {
      count += 1;
      return { id, count };
    });
    const a = cache('a');
    expect(a).toStrictEqual({ id: 'a', count: 1 });
    const b = cache('b');
    expect(b).toStrictEqual({ id: 'b', count: 2 });
    expect(b).not.toBe(a);
    const c = cache('a');
    expect(c).toStrictEqual({ id: 'a', count: 1 });
    expect(c).toBe(a);
  });
});
