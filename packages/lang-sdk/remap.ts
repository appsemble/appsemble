import { filter, literalValues, param } from '@odata/parser';
import { addMilliseconds, format, parse, parseISO } from 'date-fns';
import equal from 'fast-deep-equal';
import { XMLParser } from 'fast-xml-parser';
import { createEvent, type EventAttributes } from 'ics';
import { type IntlMessageFormat } from 'intl-messageformat';
import parseDuration from 'parse-duration';

import { getDuration, processLocation } from './ics.js';
import { mapValues } from './mapValues.js';
import { has, stripNullValues } from './miscellaneous.js';
import {
  type AppMemberGroup,
  type AppMemberInfo,
  type ArrayRemapper,
  type Remapper,
  type Remappers,
} from './types/index.js';

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

export type AppConfigEntryValue = boolean | number | string | undefined;
export type AppConfigEntryGetter = (name: string) => AppConfigEntryValue;

export interface RemapperContext {
  /**
   * The id of the app whose context the remapper is run in.
   */
  appId: number;

  /**
   * The metadata of the group selected by the app member.
   */
  group: AppMemberGroup | undefined;

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
   * Translated name of the current page.
   */
  pageName?: string;

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
    prevItem: unknown;
    nextItem: unknown;
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function isEqualArray(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((val, i) => val === b[i]);
}

function isEqualObject(a: Record<string, any>, b: Record<string, any>): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => bKeys.includes(key) && equal(a[key], b[key]));
}

function isNumber(a: unknown): boolean {
  return a !== undefined && a != null && a !== '' && !Number.isNaN(Number(a));
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
    if (prop === 'name') {
      return context.pageName;
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 18048 variable is possibly undefined (strictNullChecks)
    return context.stepRef.current[mapper];
  },

  'tab.name'(mapper, input, context) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 18048 variable is possibly undefined (strictNullChecks)
    return context.tabRef.current.name;
  },

  gt: ([left, right], input: any, context) =>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Messed up - 2571 Object is of type 'unknown'.
    remap(left, input, context) > remap(right, input, context),

  lt: ([left, right], input: any, context) =>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  'object.compare'([remapper1, remapper2], input, context) {
    const remapped1 = remap(remapper1, input, context);
    const remapped2 = remap(remapper2, input, context);

    type Diff =
      | { path: string[]; type: 'added'; value: unknown }
      | { path: string[]; type: 'changed'; from: unknown; to: unknown }
      | { path: string[]; type: 'removed'; value: unknown };

    function deepDiff(object1: Record<string, unknown>, object2: Record<string, unknown>): Diff[] {
      const stack = [{ obj1: object1, obj2: object2, path: [] as string[] }];
      const diffs: Diff[] = [];

      while (stack.length !== 0) {
        const { obj1, obj2, path } = stack.pop()!;
        const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

        for (const key of keys) {
          const val1 = obj1?.[key];
          const val2 = obj2?.[key];
          const currentPath = [...path, key];

          if (isPlainObject(val1) && isPlainObject(val2)) {
            stack.push({ obj1: val1, obj2: val2, path: currentPath });
          } else if (Array.isArray(val1) && Array.isArray(val2) && !isEqualArray(val1, val2)) {
            diffs.push({ path: currentPath, type: 'changed', from: val1, to: val2 });
          } else if (!(key in obj1)) {
            diffs.push({ path: currentPath, type: 'added', value: val2 });
          } else if (!(key in obj2)) {
            diffs.push({ path: currentPath, type: 'removed', value: val1 });
          } else if (val1 !== val2) {
            diffs.push({ path: currentPath, type: 'changed', from: val1, to: val2 });
          }
        }
      }

      return diffs;
    }

    if (!isPlainObject(remapped1) || !isPlainObject(remapped2)) {
      return [];
    }

    return deepDiff(remapped1, remapped2);
  },

  'object.explode'(property, input) {
    if (!isPlainObject(input)) {
      return [];
    }

    const { [property]: arrayValue, ...rest } = input;

    if (!Array.isArray(arrayValue)) {
      return [];
    }

    return arrayValue.map((item) => ({
      ...rest,
      ...item,
    }));
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  'array.map': (mapper, input: any[], context) =>
    input?.map((item, index) =>
      remap(mapper, item, {
        ...context,
        array: {
          index,
          length: input.length,
          item,
          prevItem: input[index - 1],
          nextItem: input[index + 1],
        },
      }),
    ) ?? [],

  'array.range'(countRemapper, input, context) {
    const count = remap(countRemapper, input, context);
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
      return [];
    }
    return Array.from({ length: count }, (item, idx) => idx);
  },

  'array.contains'(mapper, input, context) {
    if (!Array.isArray(input)) {
      return false;
    }
    const remapped = remap(mapper, input, context);
    if (isPlainObject(remapped)) {
      return input.some((item) => isEqualObject(item, remapped ?? {}));
    }
    if (Array.isArray(remapped)) {
      return input.some((item) => isEqualArray(item, remapped));
    }
    return input.includes(remapped);
  },

  'array.join'(separator, input) {
    if (!Array.isArray(input)) {
      return input;
    }
    return input.join(separator ?? undefined);
  },

  'array.unique'(mapper, input, context) {
    if (!Array.isArray(input)) {
      return input;
    }

    const remapped = input.map((item, index) =>
      mapper == null
        ? item
        : remap(mapper, item, {
            ...context,
            array: {
              index,
              length: input.length,
              item,
              prevItem: input[index - 1],
              nextItem: input[index + 1],
            },
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  array: (prop, input: any[], context) => context.array?.[prop],

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  'array.filter'(mapper, input: any[], context) {
    if (!Array.isArray(input)) {
      console.error(`${input} is not an array!`);
      return null;
    }

    return input?.filter((item, index) => {
      const remapped = remap(mapper, item, {
        ...context,
        array: {
          index,
          length: input.length,
          item,
          prevItem: input[index - 1],
          nextItem: input[index + 1],
        },
      });

      return remapped;
    });
  },

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore 2322 ... is not assignable to type (strictNullChecks)
  len: (args, input: any[] | string) => input?.length,

  history: (index, input, context) => context.history?.[index],

  'from.history': ({ index, props }, input, context) =>
    mapValues(props, (mapper) => remap(mapper, context.history?.[index], context)),

  'assign.history': ({ index, props }, input: any, context) => ({
    ...input,
    ...mapValues(props, (mapper) => remap(mapper, context.history?.[index], context)),
  }),

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  'string.contains'(stringToCheck: string, input) {
    if (!(typeof input === 'string')) {
      return false;
    }
    return input.includes(stringToCheck);
  },

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
    const remappedId = remap(messageId, input, context);
    if (typeof remappedId !== 'string') {
      return null;
    }
    const message = context.getMessage({ id: remappedId });
    return message.format() || `{${remappedId}}`;
  },

  group: (property, input, context) => context.group?.[property],

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
        type === 'String' && remapped != null
          ? literalValues[type](
              String(remappedDefined).replaceAll("'", "''").replaceAll('\\', '\\\\'),
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

  maths(value, input, context) {
    const { a, b, operation } = value;
    const aRemapped = remap(a, input, context);
    const bRemapped = remap(b, input, context);

    if (!isNumber(aRemapped) || !isNumber(bRemapped)) {
      return -1;
    }

    const na = Number(aRemapped);
    const nb = Number(bRemapped);

    switch (operation) {
      case 'add':
        return na + nb;
      case 'subtract':
        return na - nb;
      case 'multiply':
        return na * nb;
      case 'divide':
        if (nb === 0) {
          return -1;
        }
        return na / nb;
      case 'mod':
        return na % nb;
      default:
        return -1;
    }
  },
};
