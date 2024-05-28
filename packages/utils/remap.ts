import {
  type AppMember,
  type ArrayRemapper,
  type Remapper,
  type Remappers,
  type UserInfo,
  type ValueFromProcess,
} from '@appsemble/types';
import { addMilliseconds, format, parse, parseISO } from 'date-fns';
import equal from 'fast-deep-equal';
import { createEvent, type EventAttributes } from 'ics';
import { type IntlMessageFormat } from 'intl-messageformat';
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
   * Log an info message to the console.
   *
   * @param args The message to render to the console.
   */
  info: (...args: unknown[]) => void;

  /**
   * Log a warning message to the console.
   *
   * @param args The message to render to the console.
   */
  warn: (...args: unknown[]) => void;

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

export type AppConfigEntryGetter = (name: string) => ValueFromProcess;

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
   * @see VariableGetter
   */
  getVariable: AppConfigEntryGetter;

  /**
   * The history stack containing the states before an action was called.
   */
  history?: unknown[];

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

  /**
   * The appMember object for the current user in the app.
   */
  appMember: AppMember;
}

interface InternalContext extends RemapperContext {
  root?: unknown;

  array?: {
    index: number;
    length: number;
    item: unknown;
  };

  stepRef?: {
    current: Record<string, any>;
  };

  tabRef?: {
    current: Record<string, any>;
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
  // Workaround for ts(2589) Type instantiation is excessively deep and possibly infinite
  const remappers = Array.isArray(remapper)
    ? remapper.flat(Number.POSITIVE_INFINITY as 1)
    : [remapper];
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

  context(prop, input, context) {
    let result = context.context;
    for (const p of String(prop).split('.')) {
      if (result == null) {
        return null;
      }
      result = result[p];
    }
    return result ?? null;
  },

  variable(name, input, context) {
    if (context.getVariable) {
      return context.getVariable(name);
    }
    return { variable: name };
  },

  equals(mappers, input: any, context) {
    if (mappers.length <= 1) {
      return true;
    }

    const values = mappers.map((mapper) => remap(mapper, input, context));
    return values.every((value) => equal(values[0], value));
  },

  not(mappers, input, context) {
    if (mappers.length <= 1) {
      return !remap(mappers[0], input, context);
    }

    const [firstValue, ...otherValues] = mappers.map((mapper) => remap(mapper, input, context));

    return !otherValues.some((value) => equal(firstValue, value));
  },

  step(mapper, input, context) {
    return context.stepRef.current[mapper];
  },

  'tab.name'(mapper, input, context) {
    return context.tabRef.current.name;
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

  match(mappers, input, context) {
    return (
      remap(mappers.find((mapper) => remap(mapper.case, input, context))?.value, input, context) ??
      null
    );
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
        let acc = result;
        for (const [index, k] of key.entries()) {
          if (index === key.length - 1) {
            delete acc[k];
          } else {
            acc = acc?.[k];
          }
        }
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
        array: { index, length: input.length, item },
      }),
    ) ?? [],

  'array.unique'(mapper, input, context) {
    if (!Array.isArray(input)) {
      return input;
    }

    const remapped = input.map((item, index) =>
      mapper == null
        ? item
        : remap(mapper, item, {
            ...context,
            array: { index, length: input.length, item },
          }),
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

  'array.find'(mapper, input: any[], context) {
    if (!Array.isArray(input)) {
      console.error(`${input} is not an array!`);
      return null;
    }

    return (
      input?.find((item) => {
        const remapped = remap(mapper, item, context);
        switch (typeof remapped) {
          case 'boolean':
            return remap(mapper, item, context) ? item : null;
          default:
            return equal(remapped, item) ? item : null;
        }
      }) ?? null
    );
  },

  'array.from': (mappers, input, context) => mappers.map((mapper) => remap(mapper, input, context)),

  'array.append': (mappers, input, context) =>
    Array.isArray(input)
      ? input.concat(mappers.map((mapper) => remap(mapper, input, context)))
      : [],

  'array.omit'(mappers, input, context) {
    const indices = new Set(
      mappers.map((mapper) => {
        const remapped = remap(mapper, input, context);
        if (typeof remapped === 'number') {
          return remapped;
        }
      }),
    );
    return Array.isArray(input) ? input.filter((value, i) => !indices.has(i)) : [];
  },

  static: (input) => input,

  prop(prop, obj, context) {
    let result: any = obj;

    if (result == null) {
      return result;
    }

    if (Array.isArray(prop)) {
      if (prop.every((item) => typeof item === 'number' || typeof item === 'string')) {
        // This runs if the provided value is an array of property names or indexes
        for (const p of [prop].flat() as number[] | string) {
          result = result[p];
        }
      } else if (prop.every((item) => typeof item === 'object' && !Array.isArray(item))) {
        // This runs if the provided value is an array of remappers
        const remapped = remap(prop as ArrayRemapper, obj, context);
        if (typeof remapped === 'number' || typeof remapped === 'string') {
          result = result[remapped];
        } else {
          console.error(`Invalid remapper ${JSON.stringify(prop)}`);
        }
      }
    } else if (typeof prop === 'object') {
      if (prop == null) {
        result = result.null;
        return result;
      }

      // This runs if the provided value is a remapper
      const remapped = remap(prop, result, context);
      if (typeof remapped === 'number' || typeof remapped === 'string') {
        result = result[remapped];
      } else {
        console.error(`Invalid remapper ${JSON.stringify(prop)}`);
      }
    } else if (typeof prop === 'number' || typeof prop === 'string') {
      result = result[prop];
    }

    return result;
  },

  'number.parse'(remapper, input, context) {
    if (!remapper) {
      const inputConverted = Number(input);
      if (!Number.isNaN(inputConverted)) {
        return inputConverted;
      }
      return input;
    }

    const remapped = remap(remapper, input, context);
    const remappedConverted = Number(remapped);
    if (!Number.isNaN(remappedConverted)) {
      return remappedConverted;
    }
    return remapped;
  },

  'date.parse': (fmt, input: string) => (fmt ? parse(input, fmt, new Date()) : parseISO(input)),

  'date.now': () => new Date(),

  'date.add'(time, input: any) {
    const expireDuration = parseDuration(time);

    if (!expireDuration || !input || (!Number.isFinite(input) && !(input instanceof Date))) {
      return input;
    }

    return addMilliseconds(input, expireDuration);
  },

  'date.format'(args, input) {
    const date =
      input instanceof Date
        ? input
        : typeof input === 'number'
          ? new Date(input)
          : parseISO(String(input));

    return args ? format(date, args) : date.toJSON();
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

  history: (index, input, context) => context.history?.[index],

  'from.history': ({ index, props }, input, context) =>
    mapValues(props, (mapper) => remap(mapper, context.history[index], context)),

  'assign.history': ({ index, props }, input: any, context) => ({
    ...input,
    ...mapValues(props, (mapper) => remap(mapper, context.history[index], context)),
  }),

  'omit.history'({ index, keys }, input: Record<string, any>, context) {
    const result = { ...(context.history[index] as Record<string, any>) };
    for (const key of keys) {
      if (Array.isArray(key)) {
        let acc = result;
        for (const [i, k] of key.entries()) {
          if (i === key.length - 1) {
            delete acc[k];
          } else {
            acc = acc?.[k];
          }
        }
      } else {
        delete result[key];
      }
    }
    return { ...input, ...result };
  },

  'string.case'(stringCase, input) {
    if (stringCase === 'lower') {
      return String(input).toLowerCase();
    }
    if (stringCase === 'upper') {
      return String(input).toUpperCase();
    }
    return input;
  },

  log(level, input, context) {
    console[level ?? 'info'](JSON.stringify({ input, context }, null, 2));
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
    return String(input).replaceAll(new RegExp(regex, 'gm'), replacer);
  },

  translate(messageId, input, context) {
    const message = context.getMessage({ id: messageId });
    return message.format() || `{${messageId}}`;
  },

  user: (property, input, context) => context.userInfo?.[property],

  appMember: (property, input, context) => context.userInfo?.appMember?.[property],
};
