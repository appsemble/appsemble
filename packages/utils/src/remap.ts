import { Remapper, Remappers, UserInfo } from '@appsemble/types';
import { addMilliseconds, parse, parseISO } from 'date-fns';
import equal from 'fast-deep-equal';
import { IntlMessageFormat } from 'intl-messageformat';
import parseDuration from 'parse-duration';

import { mapValues } from './mapValues';

export interface IntlMessage {
  id?: string;
  defaultMessage?: string;
}

export type MessageGetter = (msg: IntlMessage) => IntlMessageFormat;

export interface RemapperContext {
  getMessage: (msg: IntlMessage) => IntlMessageFormat;
  userInfo: UserInfo;
  context: Record<string, any>;
}

interface InternalContext extends RemapperContext {
  root?: unknown;

  array?: {
    index: number;
    length: number;
  };
}

type MapperImplementations = {
  [F in keyof Remappers]: (args: Remappers[F], input: unknown, context: InternalContext) => unknown;
};

export function remap(
  remapper: Remapper,
  input: unknown,
  context: RemapperContext | InternalContext,
): unknown {
  if (
    typeof remapper === 'string' ||
    typeof remapper === 'number' ||
    typeof remapper === 'boolean' ||
    remapper == null
  ) {
    return remapper;
  }

  return [].concat(remapper).reduce((acc, mapper) => {
    const entries = Object.entries(mapper) as [[keyof MapperImplementations, unknown]];
    if (entries.length !== 1) {
      throw new Error(`Remapper has duplicate function definition: ${JSON.stringify(mapper)}`);
    }
    const [[name, args]] = entries;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return mapperImplementations[name](args, acc, { root: input, ...context });
  }, input);
}

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

    const values = mappers.map((mapper) => remap(mapper, input, context));
    return values.every((value) => equal(values[0], value));
  },

  if: (mappers, input, context) => {
    const condition = remap(mappers.condition, input, context);
    return remap(condition ? mappers.then : mappers.else, input, context);
  },

  'object.from': (mappers, input, context) =>
    mapValues(mappers, (mapper) => remap(mapper, input, context)),

  'object.assign': (mappers, input: any, context) => ({
    ...input,
    ...mapValues(mappers, (mapper) => remap(mapper, input, context)),
  }),

  'array.map': (mapper, input: any[], context) =>
    input?.map((item, index) =>
      remap(mapper, item, {
        ...context,
        array: { index, length: input.length },
      }),
    ) ?? [],

  array: (prop, input, context) => context.array?.[prop],

  static: (input) => input,

  prop: (prop, obj: Record<string, unknown>) =>
    String(prop)
      .split('.')
      .reduce((acc, p) => acc?.[p] ?? null, obj),

  'date.parse': (format, input: string) =>
    format ? parse(input, format, new Date()) : parseISO(input),

  'date.now': () => new Date(),

  'date.add': (time, input: any) => {
    const expireDuration = parseDuration(time);

    if (!expireDuration || !input || (!Number.isFinite(input) && !(input instanceof Date))) {
      return input;
    }

    return addMilliseconds(input, expireDuration);
  },

  root: (args, input, context) => context.root,

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
