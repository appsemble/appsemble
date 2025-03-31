import {
  type AppMemberInfo,
  type ArrayRemapper,
  type Remapper,
  type Remappers,
  type SubstringCaseType,
  type ValueFromProcess,
} from '@appsemble/types';
import { filter, literalValues, param } from '@odata/parser';
import { addMilliseconds, format, parse, parseISO } from 'date-fns';
import equal from 'fast-deep-equal';
import { XMLParser } from 'fast-xml-parser';
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
   * The OpenID compatible userinfo object for the current app member.
   */
  appMemberInfo: AppMemberInfo;

  /**
   * A custom context passed to the remap function.
   */
  context: Record<string, any>;
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
    const implementation = mapperImplementations[name]! as (
      // Fixes weird type union issue where the type union for `args` turns into `never`
      args: any,
      input: unknown,
      context: InternalContext,
    ) => unknown;
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

  or(mappers, input, context) {
    const values = mappers.map((mapper) => Boolean(remap(mapper, input, context)));
    return values.length > 0 ? values.includes(true) : true;
  },

  and(mappers, input, context) {
    const values = mappers.map((mapper) => remap(mapper, input, context));
    return values.every(Boolean);
  },

  step(mapper, input, context) {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 18048 variable is possibly undefined (strictNullChecks)
    return context.stepRef.current[mapper];
  },

  'tab.name'(mapper, input, context) {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 18048 variable is possibly undefined (strictNullChecks)
    return context.tabRef.current.name;
  },

  gt: ([left, right], input: any, context) =>
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore Messed up - 2571 Object is of type 'unknown'.
    remap(left, input, context) > remap(right, input, context),

  lt: ([left, right], input: any, context) =>
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore Messed up - 2571 Object is of type 'unknown'.
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
      description: remap(mappers.description ?? null, input, context) as string,
      url: remap(mappers.url ?? null, input, context) as string,
      location: remap(mappers.location ?? null, input, context) as string,
      geo: processLocation(remap(mappers.coordinates ?? null, input, context)),
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
      remap(
        mappers.find((mapper) => remap(mapper.case, input, context))?.value ?? null,
        input,
        context,
      ) ?? null
    );
  },

  'object.from': (mappers, input, context) =>
    mapValues(mappers, (mapper) => remap(mapper, input, context)),

  'object.assign': (mappers, input: any, context) => ({
    ...input,
    ...mapValues(mappers, (mapper) => remap(mapper, input, context)),
  }),

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
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

  type(args, input) {
    // eslint-disable-next-line eqeqeq
    if (input === null) {
      return null;
    }

    if (Array.isArray(input)) {
      return 'array';
    }

    return typeof input;
  },

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
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

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  array: (prop, input: any[], context) => context.array?.[prop],

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  'array.filter'(mapper, input: any[], context) {
    if (!Array.isArray(input)) {
      console.error(`${input} is not an array!`);
      return null;
    }

    return input?.filter((item, index) => {
      const remapped = remap(mapper, item, {
        ...context,
        array: { index, length: input.length, item },
      });

      return remapped;
    });
  },

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
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

  'array.flatten'(mapper, input, context) {
    if (!Array.isArray(input)) {
      return input;
    }

    const depth = remap(mapper, input, context) as number;

    return (input as unknown[]).flat(depth || Number.POSITIVE_INFINITY);
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
      result =
        Array.isArray(result) && typeof prop === 'number' && prop < 0
          ? result[result.length + prop]
          : result[prop];
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

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
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

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
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

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  len: (args, input: any[] | string) => input?.length,

  history: (index, input, context) => context.history?.[index],

  'from.history': ({ index, props }, input, context) =>
    mapValues(props, (mapper) => remap(mapper, context.history?.[index], context)),

  'assign.history': ({ index, props }, input: any, context) => ({
    ...input,
    ...mapValues(props, (mapper) => remap(mapper, context.history?.[index], context)),
  }),

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  'omit.history'({ index, keys }, input: Record<string, any>, context) {
    const result = { ...(context.history?.[index] as Record<string, any>) };
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

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  'string.startsWith'(substring: SubstringCaseType | string, input: string) {
    if (typeof substring === 'string') {
      return input.startsWith(substring);
    }
    if (substring.strict || substring.strict === undefined) {
      return input.startsWith(substring.substring);
    }
    return input.toLowerCase().startsWith(substring.substring.toLowerCase());
  },

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  'string.endsWith'(substring: SubstringCaseType | string, input: string) {
    if (typeof substring === 'string') {
      return input.endsWith(substring);
    }
    if (substring.strict || substring.strict === undefined) {
      return input.endsWith(substring.substring);
    }
    return input.toLowerCase().endsWith(substring.substring.toLowerCase());
  },

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2322 null is not assignable to type (strictNullChecks)
  slice(sliceIndex: number | [number, number], input: string | []) {
    try {
      return Array.isArray(sliceIndex) ? input.slice(...sliceIndex) : input.slice(sliceIndex);
    } catch {
      return null;
    }
  },

  log(level, input, context) {
    console[level ?? 'info'](JSON.stringify({ input, context }, null, 2));
    return input;
  },

  'string.format'({ messageId, template, values }, input, context) {
    try {
      const remappedMessageId = remap(messageId ?? null, input, context) as string;
      const message = context.getMessage({ id: remappedMessageId, defaultMessage: template });
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

  'app.member': (property, input, context) => context.appMemberInfo?.[property],

  container(property, input, context) {
    // This value is replaced when the request is made
    // By using the value of the release name
    const namespace = 'companion-containers-appsemble';
    const appName = context.appUrl.split('.')[0].replace(/^https?:\/\//, '');
    const endpoint = property.split('/').slice(1).join('/');

    const containerName = `${property.split('/')[0]}-${appName}-${context.appId}`
      .replaceAll(' ', '-')
      .toLowerCase();

    const url = `http://${containerName}.${namespace}.svc.cluster.local/${endpoint}`;
    return url;
  },

  'filter.from'(values, input, context) {
    let result = filter();
    for (const [field, { comparator, type, value }] of Object.entries(values)) {
      const remapped = remap(value, input, context);
      const remappedDefined = remapped === undefined ? null : remapped;
      const literal =
        type === 'String' && value != null
          ? literalValues[type](
              (remappedDefined as string).replaceAll("'", "''").replaceAll('\\', '\\\\'),
            )
          : literalValues[type === 'Number' ? 'Decimal' : type](remappedDefined as never);

      result = result.field(field)[comparator](literal);
    }

    return String(param().filter(result)).replace(/^\$filter=/, '');
  },

  'order.from'(values) {
    return String(
      param().orderby(Object.entries(values).map(([key, order]) => ({ field: key, order }))),
    ).replace('$orderby=', '');
  },

  'xml.parse'(value, input, context) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });

    try {
      return parser.parse((remap(value, input, context) as string) || '');
    } catch (error) {
      console.error(error);
      return {};
    }
  },

  defined(value, input, context) {
    const remapped = remap(value, input, context);
    return remapped !== undefined && remapped != null;
  },
};
