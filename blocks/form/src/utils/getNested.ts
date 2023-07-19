import { type Values } from '../../block.js';

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
