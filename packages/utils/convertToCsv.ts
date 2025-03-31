import { compareStrings } from './index.js';

/**
 * Converts an object or an array of objects to a valid CSV format.
 *
 * Implements https://tools.ietf.org/html/rfc4180
 *
 * @param body An object containing the data to be converted.
 * @returns The data serialized as CSV.
 */
export function convertToCsv(body: any): string {
  const separator = ',';
  const lineEnd = '\r\n';
  const quote = '"';
  const quoteRegex = new RegExp(quote, 'g');
  const escape = (value: string): string =>
    value.includes(separator) || value.includes(lineEnd) || value.includes(quote)
      ? `${quote}${value.replaceAll(quoteRegex, `${quote}${quote}`)}${quote}`
      : value;

  if (body == null) {
    throw new Error('No data');
  }

  if (typeof body !== 'object') {
    throw new TypeError('Data is of an invalid type');
  }

  const data = Array.isArray(body) ? body : [body];

  if (data.length === 0) {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 2322 null is not assignable to type (strictNullChecks)
    return null;
  }

  const headers = [...new Set(data.flatMap((value) => Object.keys(value)))].sort(compareStrings);

  if (headers.length === 0) {
    throw new Error('No headers could be found');
  }

  const lines = data.map((object) => {
    const values = headers.map((header) => {
      let value = object[header];
      if (value == null) {
        return '';
      }

      if ((value as Date).toJSON instanceof Function) {
        value = (value as Date).toJSON();
      }

      if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }

      return escape(value as string);
    });

    return values.join(separator);
  });

  return `${headers.map((header) => escape(header)).join(separator)}${lineEnd}${lines.join(
    lineEnd,
  )}${lineEnd}`;
}
