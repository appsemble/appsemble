import { Remapper, Remappers, UserInfo } from '@appsemble/types';
import { addMilliseconds, parse, parseISO } from 'date-fns';
import equal from 'fast-deep-equal';
import { createEvent, EventAttributes } from 'ics';
import { IntlMessageFormat } from 'intl-messageformat';
import parseDuration from 'parse-duration';

import { has } from './has.js';
import { getDuration, processLocation } from './ics.js';
import { mapValues } from './mapValues.js';
import { stripNullValues } from './miscellaneous.js';

/**
 * Stub the console types, since we don’t want to use dom or node types here.
 */
declare const console: {
  /**
   * Log an error message to the console.
   *
   * @param args The message to render to the console.
   */
  error: (...args: unknown[]) => void;
};

export interface IntlMessage {
  id?: string;
  defaultMessage?: string;
}

/**
 * Get a message format instance based on a message id and default message.
 *
 * @param msg The message to get the message format instance for.
 * @returns A message format instance.
 */
export type MessageGetter = (msg: IntlMessage) => IntlMessageFormat;

export interface RemapperContext {
  /**
   * The id of the app whose context the remapper is run in.
   */
  appId: number;

  /**
   * The current URL.
   */
  url: string;

  /**
   * The base URL of the app.
   */
  appUrl: string;

  /**
   * @see MessageGetter
   */
  getMessage: MessageGetter;

  /**
   * The current locale of the app.
   */
  locale: string;

  /**
   * Custom data that is available in the page.
   */
  pageData?: unknown;

  /**
   * The OpenID compatible userinfo object for the current user.
   */
  userInfo: UserInfo;

  /**
   * A custom context passed to the remap function.
   */
  context: Record<string, any>;
}

interface InternalContext extends RemapperContext {
  root?: unknown;
  history?: unknown[];

  array?: {
    index: number;
    length: number;
  };
}

type MapperImplementations = {
  [F in keyof Remappers]: (args: Remappers[F], input: unknown, context: InternalContext) => unknown;
};

class RemapperError extends TypeError {
  remapper: Remapper;

  constructor(message: string, remapper: Remapper) {
    super(message);
    this.name = 'RemapperError';
    this.remapper = remapper;
  }
}

export function remap(
  remapper: Remapper,
  input: unknown,
  context: InternalContext | RemapperContext,
): unknown {
  if (
    typeof remapper === 'string' ||
    typeof remapper === 'number' ||
    typeof remapper === 'boolean' ||
    remapper == null
  ) {
    return remapper;
  }

  let result = input;
  const remappers = Array.isArray(remapper) ? remapper : [remapper];
  for (const mapper of remappers) {
    const entries = Object.entries(mapper) as [keyof MapperImplementations, unknown][];
    if (entries.length !== 1) {
      console.error(mapper);
      throw new RemapperError(
        `Remapper has multiple keys: ${Object.keys(mapper)
          .map((key) => JSON.stringify(key))
          .join(', ')}`,
        mapper,
      );
    }
    const [[name, args]] = entries;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (!has(mapperImplementations, name)) {
      console.error(mapper);
      throw new RemapperError(`Remapper name does not exist: ${JSON.stringify(name)}`, mapper);
    }
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const implementation = mapperImplementations[name];
    result = implementation(args as any, result, { root: input, ...context });
  }
  return result;
}

/**
 * Implementations of all remappers.
 *
 * All arguments are deferred from remappers.
 *
 * @see Remappers
 */
const mapperImplementations: MapperImplementations = {
  app(prop, input, context) {
    if (prop === 'id') {
      return context.appId;
    }
    if (prop === 'locale') {
      return context.locale;
    }
    if (prop === 'url') {
      return context.appUrl;
    }
    throw new Error(`Unknown app property: ${prop}`);
  },

  page(prop, input, context) {
    if (prop === 'data') {
      return context.pageData;
    }
    if (prop === 'url') {
      return context.url;
    }
    throw new Error(`Unknown page property: ${prop}`);
  },

  context: (prop, input, context) =>
    String(prop)
      .split('.')
      .reduce((acc, p) => acc?.[p] ?? null, context.context),

  equals(mappers, input: any, context) {
    if (mappers.length <= 1) {
      return true;
    }

    const values = mappers.map((mapper) => remap(mapper, input, context));
    return values.every((value) => equal(values[0], value));
  },

  gt: ([left, right], input: any, context) =>
    remap(left, input, context) > remap(right, input, context),

  lt: ([left, right], input: any, context) =>
    remap(left, input, context) < remap(right, input, context),

  ics(mappers, input, context) {
    let event;
    const mappedStart = remap(mappers.start, input, context);
    const start = mappedStart instanceof Date ? mappedStart : parseISO(mappedStart as string);
    const sharedAttributes = {
      start: [
        start.getUTCFullYear(),
        start.getUTCMonth() + 1,
        start.getUTCDate(),
        start.getUTCHours(),
        start.getUTCMinutes(),
      ],
      startInputType: 'utc',
      startOutputType: 'utc',
      title: remap(mappers.title, input, context) as string,
      description: remap(mappers.description, input, context) as string,
      url: remap(mappers.url, input, context) as string,
      location: remap(mappers.location, input, context) as string,
      geo: processLocation(remap(mappers.coordinates, input, context)),
      productId: context.appUrl,
    };

    if ('end' in mappers) {
      const mappedEnd = remap(mappers.end, input, context);
      const end = mappedEnd instanceof Date ? mappedEnd : parseISO(mappedEnd as string);
      event = {
        ...sharedAttributes,
        endInputType: 'utc',
        endOutputType: 'utc',
        end: [
          end.getUTCFullYear(),
          end.getUTCMonth() + 1,
          end.getUTCDate(),
          end.getUTCHours(),
          end.getUTCMinutes(),
        ],
      };
    } else {
      event = {
        ...sharedAttributes,
        duration: getDuration(remap(mappers.duration, input, context) as string),
      };
    }

    const { error, value } = createEvent(event as EventAttributes);
    if (error) {
      throw error;
    }
    return value;
  },

  if(mappers, input, context) {
    const condition = remap(mappers.condition, input, context);
    return remap(condition ? mappers.then : mappers.else, input, context);
  },

  'object.from': (mappers, input, context) =>
    mapValues(mappers, (mapper) => remap(mapper, input, context)),

  'object.assign': (mappers, input: any, context) => ({
    ...input,
    ...mapValues(mappers, (mapper) => remap(mapper, input, context)),
  }),

  'object.omit'(keys, input: Record<string, any>) {
    const result = { ...input };
    for (const key of keys) {
      if (Array.isArray(key)) {
        key.reduce((acc, k, index) => {
          if (index === key.length - 1) {
            delete acc[k];
          } else {
            return acc?.[k];
          }
          return acc;
        }, result);
      } else {
        delete result[key];
      }
    }
    return result;
  },

  'array.map': (mapper, input: any[], context) =>
    input?.map((item, index) =>
      remap(mapper, item, {
        ...context,
        array: { index, length: input.length },
      }),
    ) ?? [],

  'array.unique'(mapper, input, context) {
    if (!Array.isArray(input)) {
      return input;
    }

    const remapped = input.map((value, index) =>
      mapper == null
        ? value
        : remap(mapper, value, { ...context, array: { index, length: input.length } }),
    );
    return input.filter((value, index) => {
      for (let i = 0; i < index; i += 1) {
        if (equal(remapped[index], remapped[i])) {
          return false;
        }
      }

      return true;
    });
  },

  array: (prop, input, context) => context.array?.[prop],

  static: (input) => input,

  prop: (prop, obj: Record<string, unknown>) => [].concat(prop).reduce((acc, p) => acc?.[p], obj),

  'date.parse': (format, input: string) =>
    format ? parse(input, format, new Date()) : parseISO(input),

  'date.now': () => new Date(),

  'date.add'(time, input: any) {
    const expireDuration = parseDuration(time);

    if (!expireDuration || !input || (!Number.isFinite(input) && !(input instanceof Date))) {
      return input;
    }

    return addMilliseconds(input, expireDuration);
  },

  'null.strip': (args, input) => stripNullValues(input, args || {}),

  'random.choice': (args, input: any[]) =>
    Array.isArray(input) ? input[Math.floor(Math.random() * input.length)] : input,

  'random.integer'(args) {
    const min = Math.min(...args);
    const max = Math.max(...args);
    return Math.floor(Math.random() * (max - min) + min);
  },

  'random.float'(args) {
    const min = Math.min(...args);
    const max = Math.max(...args);
    return Math.random() * (max - min) + min;
  },

  'random.string'(args) {
    const result: string[] = [];
    const characters = [...new Set(args.choice.split(''))];
    for (let i = 0; i <= args.length; i += 1) {
      result.push(characters[Math.floor(Math.random() * characters.length)]);
    }
    return result.join('');
  },

  root: (args, input, context) => context.root,

  prior: (index, input, context) => context.history?.[index],

  'string.case'(stringCase, input) {
    if (stringCase === 'lower') {
      return String(input).toLowerCase();
    }
    if (stringCase === 'upper') {
      return String(input).toUpperCase();
    }
    return input;
  },

  'string.format'({ messageId, template, values }, input, context) {
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

  'string.replace'(values, input) {
    const [[regex, replacer]] = Object.entries(values);
    return String(input).replace(new RegExp(regex, 'gm'), replacer);
  },

  translate(messageId, input, context) {
    const message = context.getMessage({ id: messageId });
    return message.format() || `{${messageId}}`;
  },

  user: (property, input, context) => context.userInfo?.[property],
};
