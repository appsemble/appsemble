import type { Remapper, Remappers, UserInfo } from '@appsemble/types';
import { parse, parseISO } from 'date-fns';
import equal from 'fast-deep-equal';
import type { IntlMessageFormat } from 'intl-messageformat';

import { mapValues } from './mapValues';

export interface IntlMessage {
  id?: string;
  defaultMessage?: string;
}

export type MessageGetter = (msg: IntlMessage) => IntlMessageFormat;

export interface RemapperContext {
  getMessage: (msg: IntlMessage) => IntlMessageFormat;
  userInfo: UserInfo;
  context: { [key: string]: any };
}

type MapperImplementations = {
  [F in keyof Remappers]: (args: Remappers[F], input: unknown, context: RemapperContext) => unknown;
};

/**
 * Implementations of all remappers.
 *
 * All arguments are deferred from {@link @appsemble/sdk#Remappers}
 */
const mapperImplementations: MapperImplementations = {
  context: (prop, _, context) =>
    String(prop)
      .split('.')
      .reduce((acc, p) => acc?.[p] ?? null, context.context),

  equals: (mappers, input: any, context) => {
    if (mappers.length <= 1) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const values = mappers.map((mapper) => remap(mapper, input, context));

    return values.every((value) => equal(values[0], value));
  },

  'object.from': (mappers, input, context) =>
    // This ESLint rule needs to be disabled, because remap is called recursively.
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    mapValues(mappers, (mapper) => remap(mapper, input, context)),

  'array.map': (mappers, input: any[], context) =>
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    [].concat(input).flatMap((item) => mappers.map((mapper) => remap(mapper, item, context))),

  static: (input) => input,

  prop: (prop, obj: { [key: string]: unknown }) =>
    String(prop)
      .split('.')
      .reduce((acc, p) => acc?.[p] ?? null, obj),

  'date.parse': (format, input: string) =>
    format ? parse(input, format, new Date()) : parseISO(input),

  'string.case': (stringCase, input) => {
    if (stringCase === 'lower') {
      return String(input).toLowerCase();
    }
    if (stringCase === 'upper') {
      return String(input).toUpperCase();
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
    } catch (error: unknown) {
      if (messageId) {
        return `{${messageId}}`;
      }

      return (error as Error).message;
    }
  },

  'string.replace': (values, input) => {
    const [[regex, replacer]] = Object.entries(values);
    return String(input).replace(new RegExp(regex, 'gm'), replacer);
  },

  user: (values, input, context) => context.userInfo?.[values],
};

export function remap(mappers: Remapper, input: unknown, context: RemapperContext): unknown {
  if (typeof mappers === 'string' || mappers == null) {
    return mappers;
  }
  return mappers.reduce((acc, mapper) => {
    const entries = Object.entries(mapper) as [[keyof MapperImplementations, unknown]];
    if (entries.length !== 1) {
      throw new Error(`Remapper has duplicate function definition: ${JSON.stringify(mapper)}`);
    }
    const [[name, args]] = entries;
    return mapperImplementations[name](args, acc, context);
  }, input);
}
