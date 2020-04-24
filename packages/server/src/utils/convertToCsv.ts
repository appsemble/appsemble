import { AppsembleError } from '@appsemble/node-utils';

/**
 * Converts an object or an array of objects to a valid CSV format.
 *
 * Implements https://tools.ietf.org/html/rfc4180
 *
 * @param body An object containing the data to be converted.
 */
export default function convertToCsv(body: { [key: string]: any }): string {
  const separator = ',';
  const lineEnd = '\r\n';
  const quote = '"';
  const quoteRegex = new RegExp(quote, 'g');
  const escape = (value: string): string =>
    value.includes(separator) || value.includes(lineEnd) || value.includes(quote)
      ? `${quote}${value.replace(quoteRegex, `${quote}${quote}`)}${quote}`
      : value;

  if (body == null) {
    throw new AppsembleError('No data');
  }

  if (typeof body !== 'object') {
    throw new AppsembleError('Data is of an invalid type');
  }

  const data = Array.isArray(body) ? body : [body];

  const headers = [...new Set(data.map(Object.keys).flat())].sort();

  if (headers.length === 0) {
    throw new AppsembleError('No headers could be found');
  }

  const lines = data.map((object) => {
    const values = headers.map((header) => {
      let value = object[header];
      if (value == null) {
        return '';
      }

      if ((value as any).toJSON instanceof Function) {
        value = value.toJSON();
      }

      if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }

      return escape(value);
    });

    return `${values.join(separator)}`;
  });

  return `${headers.map(escape).join(separator)}${lineEnd}${lines.join(lineEnd)}${lineEnd}`;
}
