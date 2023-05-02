import { type Values } from '../../block.js';

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

/**
 * Get the value in nested state by a sequence of keys.
 *
 * @param nameSequence The sequence of keys separated by a `"."`.
 * @param rootValues The nested state from where the value is retrieved.
 * @returns The value of the last property defined in the sequence.
 */
export function getValueByNameSequence(nameSequence: string, rootValues: Values): unknown {
  return (
    nameSequence
      .split('.')
      // eslint-disable-next-line unicorn/no-array-reduce
      .reduce((accumulator, current) => accumulator[current], rootValues)
  );
}
