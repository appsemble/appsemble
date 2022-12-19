import { ReadStream } from 'node:fs';

import FormData from 'form-data';

function appendFormData(key: string, value: any, form: FormData): void {
  if (value === undefined) {
    return;
  }
  if (Array.isArray(value)) {
    for (const val of value) {
      appendFormData(key, val, form);
    }
  } else {
    form.append(
      key,
      typeof value === 'string' || Buffer.isBuffer(value) || value instanceof ReadStream
        ? value
        : JSON.stringify(value),
    );
  }
}

/**
 * A convenience function for creating form data.
 *
 * @param data A key / value record of fields to append to the form data.  Booleans, numbers,
 * strings, and `null` will be added to the form data raw. Objects will be transformed to JSON
 * objects. Arrays will be iterated over and every item will be appended for the given key.
 * @returns The data represented as form data.
 */
export function createFormData(data: Record<string, any>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) {
    appendFormData(key, value, form);
  }
  return form;
}
