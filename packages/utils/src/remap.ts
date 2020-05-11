import { parse, parseISO } from 'date-fns';
import IntlMessageFormat from 'intl-messageformat';
import type { RequireExactlyOne } from 'type-fest';

import mapValues from './mapValues';

export interface Remappers {
  /**
   * Create a new object given some predefined mapper keys.
   */
  'object.from': {
    [key: string]: Remapper;
  };

  /**
   * Get a property from an object.
   */
  prop: string;

  /**
   * Convert a string to a date using a given format.
   */
  'date.parse': string;

  /**
   * Convert an input to lower or upper case.
   */
  'string.case': 'lower' | 'upper';

  /**
   * Format a string using remapped input variables.
   */
  'string.format': {
    /**
     * The template string to format.
     */
    template: string;
    /**
     * A set of remappers to convert the input to usable values.
     */
    values: {
      [key: string]: Remapper;
    };
  };
}

export type Remapper = RequireExactlyOne<Remappers>[] | string;

type MapperImplementations = {
  [F in keyof Remappers]: (args: Remappers[F], input: any) => any;
};

/**
 * Implementations of all remappers.
 *
 * All arguments are deferred from {@link @appsemble/sdk#Remappers}
 */
const mapperImplementations: MapperImplementations = {
  'object.from': (mappers, input) =>
    // This ESLint rule needs to be disabled, because remap is called recursively.
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    Object.fromEntries(Object.entries(mappers).map(([key, mapper]) => [key, remap(mapper, input)])),

  prop: (prop, obj) => prop.split('.').reduce((acc, p) => acc[p], obj),

  'date.parse': (format, input) => (format ? parse(input, format, new Date()) : parseISO(input)),

  'string.case': (stringCase, input) => {
    if (stringCase === 'lower') {
      return `${input}`.toLowerCase();
    }
    if (stringCase === 'upper') {
      return `${input}`.toUpperCase();
    }
    return input;
  },

  'string.format': ({ template, values }, input) => {
    try {
      const msg = new IntlMessageFormat(template);
      // This ESLint rule needs to be disabled, because remap is called recursively.
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return msg.format(mapValues(values, (val) => remap(val, input)));
    } catch (error) {
      return error.message;
    }
  },
};

export default function remap(mappers: Remapper, input: any): any {
  if (typeof mappers === 'string' || mappers == null) {
    return mappers;
  }
  return mappers.reduce((acc, mapper) => {
    const entries = Object.entries(mapper) as [[keyof MapperImplementations, any]];
    if (entries.length !== 1) {
      throw new Error(`Remapper has duplicate function definition: ${JSON.stringify(mapper)}`);
    }
    const [[name, args]] = entries;
    return mapperImplementations[name](args, acc);
  }, input);
}
