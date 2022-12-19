export function getNestedByKey(obj: Object, keyToFind: string): string[] {
  let result: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    result =
      key === keyToFind
        ? result.concat(value)
        : typeof value === 'object'
        ? result.concat(getNestedByKey(value, keyToFind))
        : result;
  }
  return result;
}
