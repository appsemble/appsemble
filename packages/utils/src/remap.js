import { parseISO } from 'date-fns';

const property = '.';
const filter = '|';

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const filters = {
  date: () => object => {
    let date;
    if (object instanceof Number) {
      date = new Date(object);
    } else if (typeof object === 'string') {
      date = parseISO(object);
      if (Number.isNaN(date.getTime())) {
        date = new Date(object);

        if (Number.isNaN(date)) {
          date = undefined;
        }
      }
    } else {
      date = object;
    }
    if (date instanceof Date) {
      return dateTimeFormat.format(date);
    }
    return date;
  },
  get: (context, name) => object => {
    if (object == null) {
      return undefined;
    }
    if (Array.isArray(object)) {
      const index = Number(name);
      if (Number.isInteger(index)) {
        const { length } = object;
        // This adds support for n number indexing. For example -4, -1, 2, or 5 will return the 3rd
        // item of an array of length 3.
        return object[((index % length) + length) % length];
      }
    }
    if (Object.prototype.hasOwnProperty.call(object, name)) {
      return object[name];
    }
    return undefined;
  },
  lower: () => Function.call.bind(String.prototype.toLowerCase),
  upper: () => Function.call.bind(String.prototype.toUpperCase),
};

/**
 * Compile a filter string into a function.
 *
 * This function defines a set of chained remapping filters into a callable function. A filter is
 * written using a pipe (`|`) operator, followed by the name of the filter. For example:
 *
 * ```js
 * '|lower'
 * '|upper'
 * ```
 *
 * A shorthand syntax exists for getting an object property. Simply add a dot (`.`) operator instead
 * of a pipe. This passes the name as an argument to the `get` filter.
 *
 * Besides the shorthand syntax for the `get` filter, it is not yet possible to pass arguments.
 *
 * @param {string} mapperString The string which defines the filters that should be used.
 * @param {Object} context The context to which remapper functions have access.
 * @returns {Function} the resulting mapper function.
 */
export function compileFilters(mapperString, context) {
  const { length } = mapperString;
  const result = [];
  let type = property;
  let current = '';

  function processCurrent() {
    if (type === property) {
      result.push(filters.get(context, current));
    } else if (Object.hasOwnProperty.call(filters, current)) {
      result.push(filters[current](context));
    } else {
      throw new Error(`Invalid filter ${current}`);
    }
    current = '';
  }

  for (let i = 0; i < length; i += 1) {
    const char = mapperString.charAt(i);
    if (i === 0 && (char === property || char === filter)) {
      type = char;
    } else if (char === property) {
      processCurrent();
      type = property;
    } else if (char === filter) {
      processCurrent();
      type = filter;
    } else {
      current += char;
    }
  }
  processCurrent();
  return value => result.reduce((acc, fn) => fn(acc), value);
}

/**
 * Map data given a set of mapping specifications.
 *
 * Example:
 *
 * ```js
 * > mapData({
 * >   fooz: 'foo.bar|upper'
 * > }, {
 * >   foo: {
 * >     bar: 'baz'
 * >   }
 * > });
 * { fooz: 'BAZ' }
 * ```
 *
 * @param {*} mapperData An (optionally nested) object which defines what to output.
 * @param {*} inputData The input data which should be mapped.
 * @param {Object} context The context to which remapper functions have access.
 * @returns {*} The resulting data as specified by the `mapperData` argument.
 */
export function remapData(mapperData, inputData, context) {
  if (typeof mapperData === 'string') {
    return compileFilters(mapperData, context)(inputData);
  }
  if (Array.isArray(mapperData)) {
    return mapperData.map(value => remapData(value, inputData, context));
  }
  if (mapperData instanceof Object) {
    return Object.entries(mapperData).reduce((acc, [key, value]) => {
      acc[key] = remapData(value, inputData, context);
      return acc;
    }, {});
  }
  throw new Error('Invalid mapper data');
}
