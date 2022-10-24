export function getNestedByKey(obj: Object, keyToFind: string): string[] {
  return Object.entries(obj).reduce(
    (acc, [key, value]) =>
      key === keyToFind
        ? acc.concat(value)
        : typeof value === 'object'
        ? acc.concat(getNestedByKey(value, keyToFind))
        : acc,
    [],
  );
}
