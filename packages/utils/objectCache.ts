/**
 * Create a function for memoizing values.
 *
 * The cache accepts a favtory function which is used for creating a value. If cache is called with
 * the value, the factory is called and the returned value is memoized. If the cache is called with
 * the same value again, the memoized value is returned.
 *
 * @param factory The function that generats new values if necessary.
 * @returns A getter funcion which returns the generated or memoized value.
 */
export function objectCache<T, K = string>(factory: (id: K) => T): (id: K) => T {
  const cache = new Map<K, T>();

  return (id) => {
    if (cache.has(id)) {
      return cache.get(id)!;
    }
    const item = factory(id);
    cache.set(id, item);
    return item;
  };
}
