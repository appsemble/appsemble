import type { Remapper, Remappers } from '@appsemble/types';
import { parse, parseISO } from 'date-fns';
import type IntlMessageFormat from 'intl-messageformat';

import mapValues from './mapValues';

export interface IntlMessage {
  id?: string;
  defaultMessage?: string;
}

export type MessageGetter = (msg: IntlMessage) => IntlMessageFormat;

export interface RemapperContext {
  getMessage: (msg: IntlMessage) => IntlMessageFormat;
}

type MapperImplementations = {
  [F in keyof Remappers]: (args: Remappers[F], input: any, context: RemapperContext) => any;
};

/**
 * Implementations of all remappers.
 *
 * All arguments are deferred from {@link @appsemble/sdk#Remappers}
 */
const mapperImplementations: MapperImplementations = {
  'object.from': (mappers, input, context) =>
    // This ESLint rule needs to be disabled, because remap is called recursively.
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    mapValues(mappers, (mapper) => remap(mapper, input, context)),

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

  'string.format': ({ messageId, template, values }, input, context) => {
    try {
      const message = context.getMessage({ id: messageId, defaultMessage: template });
      return message.format(
        // This ESLint rule needs to be disabled, because remap is called recursively.
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        values ? mapValues(values, (val) => remap(val, input, context)) : undefined,
      );
    } catch (error) {
      return error.message;
    }
  },
};

export default function remap(mappers: Remapper, input: any, context: RemapperContext): any {
  if (typeof mappers === 'string' || mappers == null) {
    return mappers;
  }
  return mappers.reduce((acc, mapper) => {
    const entries = Object.entries(mapper) as [[keyof MapperImplementations, any]];
    if (entries.length !== 1) {
      throw new Error(`Remapper has duplicate function definition: ${JSON.stringify(mapper)}`);
    }
    const [[name, args]] = entries;
    return mapperImplementations[name](args, acc, context);
  }, input);
}
