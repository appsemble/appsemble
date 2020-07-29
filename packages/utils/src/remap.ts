import type { Remapper, Remappers } from '@appsemble/types';
import { parse, parseISO } from 'date-fns';
import IntlMessageFormat from 'intl-messageformat';

import mapValues from './mapValues';

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

  static: (input) => input,

  prop: (prop, obj) =>
    String(prop)
      .split('.')
      .reduce((acc, p) => acc?.[p] ?? null, obj),

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

  'string.replace': (values, input) => {
    let result = `${input}`;

    for (const entry of Object.entries(values)) {
      // The value in these key-value pairs are remappers.
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      result = result.replace(new RegExp(entry[0], 'gm'), remap(entry[1], input));
    }

    return result;
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
