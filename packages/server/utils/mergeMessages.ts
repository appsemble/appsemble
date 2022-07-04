import { mergeWith } from 'lodash';

/**
 * Calls Lodash’s mergeWith function
 * but with a comparator function provided to merge any string leaves if they are truthy.
 *
 * @param object - The base object to merge.
 * @param otherArgs - A list of objects to merge.
 * @returns The resulting merged object.
 */
export function mergeMessages(object: any, ...otherArgs: any[]): any {
  return mergeWith(object, ...otherArgs, (objectValue: any, newValue: any) => {
    if (typeof newValue === 'string') {
      return newValue || objectValue;
    }
  });
}
