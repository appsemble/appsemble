import { type RequireExactlyOne } from 'type-fest';

type AppMemberInfoKey =
  | 'demo'
  | 'email_verified'
  | 'email'
  | 'locale'
  | 'name'
  | 'phoneNumber'
  | 'picture'
  | 'properties'
  | 'role'
  | 'sub'
  | 'zoneinfo';

interface BaseICSRemapper {
  /**
   * The start of the icalendar event.
   */
  start: Remapper;

  /**
   * The title of the event.
   */
  title: Remapper;

  /**
   * An optional description of the event.
   */
  description?: Remapper;

  /**
   * An optional link to attach to the event.
   */
  url?: Remapper;

  /**
   * An optional location description to attach to the event.
   */
  location?: Remapper;

  /**
   * An optional geolocation description to attach to the event.
   *
   * This must be an object with the properties `lat` or `latitude`, and `lon`, `lng` or
   * `longitude`.
   */
  coordinates?: Remapper;
}

interface DurationICSRemapper extends BaseICSRemapper {
  /**
   * The duration of the event.
   *
   * @example '1w 3d 10h 30m'
   */
  duration: Remapper;
}

interface EndTimeICSRemapper extends BaseICSRemapper {
  /**
   * The end time of the event as a date or a date string.
   */
  end: Remapper;
}

export interface SubstringCaseType {
  /**
   * Whether to match the case of the substring.
   */
  strict?: boolean;

  /**
   * Substring to match.
   */
  substring: string;
}

type FilterParams = Record<
  string,
  {
    type: 'Boolean' | 'Date' | 'Guid' | 'Number' | 'String';
    value: Remapper;
    comparator: 'eq' | 'ge' | 'gt' | 'le' | 'lt' | 'ne';
  }
>;

type OrderParams = Record<string, 'asc' | 'desc'>;

export interface Remappers {
  /**
   * Get app metadata.
   *
   * Supported properties:
   *
   * - `id`: Get the app id.
   * - `locale`: Get the current locale of the app.
   * - `url`: Get the base URL of the app.
   */
  app: 'id' | 'locale' | 'url';

  /**
   * Get group metadata.
   * Supported properties:
   *
   * - `id`: Get the id of the selected group.
   * - `role`: Role of the current app member in the group.
   * - `name`: Get the name of the selected group.
   */
  group: 'id' | 'name' | 'role';

  /**
   * Get property of the AppMember object.
   *
   * Supported properties:
   *
   * - `sub`: Get the id of the app member.
   * - `name`: Get the name of the app member.
   * - `email`: Get the email of the app member.
   * - `email_verified`: Whether the email of the app member is verified.
   * - `picture`: Get the picture of the app member.
   * - `locale`: Get the locale of the app member.
   * - `zoneinfo`: Get the zoneinfo of the app member.
   * - `role`: Get the role of the app member.
   * - `properties`: Get the custom properties of the app member.
   */
  'app.member': AppMemberInfoKey;

  /**
   * Get a predefined app variable by name.
   */
  variable: string;

  /**
   * Get page metadata.
   *
   * Supported properties:
   *
   * - `data`: Get the current page data.
   * - `url`: Get the URL of the current page.
   * - `name`: Get the translated name of the current page.
   */
  page: 'data' | 'name' | 'url';

  /**
   * Get a property from the context.
   */
  context: string;

  /**
   * Get the title of current page.
   */
  'tab.name': string;

  /**
   * Convert a string to a number.
   */
  'number.parse': Remapper;

  /**
   * Convert a string to a date using a given format.
   */
  'date.parse': string;

  /**
   * Returns the current date.
   */
  'date.now': unknown;

  /**
   * Adds to a date.
   */
  'date.add': string;

  /**
   * Formats a date to an iso8601 / rfc3339 compatible string.
   *
   * An argument can also be specified to use a different output format.
   *
   * Please refer to https://date-fns.org/docs/format for the supported patterns.
   */
  'date.format'?: string;

  /**
   * Compare all computed remapper values against each other.
   *
   * Returns `true` if all entries are equal, otherwise `false`.
   */
  equals: Remapper[];

  /**
   * Compare all computed remapper values against the first.
   *
   * Returns `false` if all entries are equal to the first entry, otherwise `true`.
   *
   * If only one remapper or none is passed, the remapper value gets computed and then inverted.
   */
  not: Remapper[];

  /**
   * Compare all computed remapper values against each other.
   *
   * Returns `true` if all entries are true, otherwise `false`.
   *
   * If only one remapper is passed, the remapper is returned.
   */
  and: Remapper[];

  /**
   * Compare all computed remapper values against each other.
   *
   * Returns `false` if all entries are false, otherwise `true`.
   *
   * If only one remapper is passed, the remapper is returned.
   */
  or: Remapper[];

  /**
   * Get data stored at the current flow page step
   */
  step: string;

  /**
   * Compares the first computed remapper value with the second computed remapper value.
   *
   * Returns `true` of the first entry is greater than the second entry.
   */
  gt: [Remapper, Remapper];

  /**
   * Compares the first computed remapper value with the second computed remapper value.
   *
   * Returns `true` of the first entry is less than the second entry.
   */
  lt: [Remapper, Remapper];

  /**
   * Logs its input data (returns it) and its context.
   *
   * The value to set is the log level.
   */
  log: 'error' | 'info' | 'warn';

  /**
   * Get input object type.
   */
  type: null;

  /**
   * Builds an array based on the given data and remappers.
   *
   * The remappers gets applied to each item in the array.
   *
   * Always returns an array, can be empty if supplied data isn’t an array.
   */
  'array.map': Remapper;

  /**
   * Creates an array of numbers from 0 to N-1.
   *
   * @example
   * { "array.range": 5 } // returns [0, 1, 2, 3, 4]
   */
  'array.range': Remapper;

  /**
   * Filters out unique entries from an array.
   *
   * The value Remapper is applied to each entry in the array,
   * using its result to determine uniqueness.
   *
   * If the value Remapper result in `undefined` or `null`, the entire entry is used for uniqueness.
   *
   * If the input is not an array, the input is returned without any modifications.
   */
  'array.unique': Remapper;

  /**
   * Flattens an array.
   *
   * The value of the remapper is used for the flattening depth.
   *
   * If the value Remapper result in `undefined` or `null`, the array will be flattened until
   * the last layer.
   *
   * If the input is not an array, the input is returned without any modifications.
   */
  'array.flatten': Remapper;

  /**
   * Create an icalendar event.
   */
  ics: DurationICSRemapper | EndTimeICSRemapper;

  /**
   * Checks if condition results in a truthy value.
   *
   * Returns value of then if condition is truthy, otherwise it returns the value of else.
   */
  if: { condition: Remapper; then: Remapper; else: Remapper };

  /**
   * Check if any case results in a truthy value.
   *
   * Returns the value of the first case where the condition equals true, otherwise returns null.
   */
  match: { case: Remapper; value: Remapper }[];

  /**
   * Get the current array.map’s index or length.
   *
   * Returns nothing if array.map’s context isn’t set.
   */
  array: 'index' | 'item' | 'length' | 'nextItem' | 'prevItem';

  /**
   *
   * Returns an array containing the items matching the specified conditions.
   */
  'array.filter': Remapper;

  /**
   * Returns an object based on the specified condition
   */
  'array.find': Remapper;

  /**
   * Create a new array with an array of predefined remappers.
   */
  'array.from': Remapper[];

  /**
   * Append new values to the end of an array.
   *
   * If the input is not an array an empty array is returned.
   */
  'array.append': Remapper[];

  /**
   * Remove item(s) from an array given a predefined array of remappable indices.
   *
   * Only the remapped values that are turned into numbers are applied.
   *
   * If the input is not an array an empty array is returned.
   */
  'array.omit': Remapper[];

  /**
   * Create a new object given some predefined mapper keys.
   */
  'object.from': Record<string, Remapper>;

  /**
   * Assign properties to an existing object given some predefined mapper keys.
   */
  'object.assign': Record<string, Remapper>;

  /**
   * Remove properties from an existing object based on the given the object keys.
   *
   * Nested properties can be removed using arrays of keys.
   *
   * @example
   * ```yaml
   * object.omit:
   *   - foo   # Removes the property foo
   *   - - bar # Removes the property baz inside of bar
   *     - baz
   * ```
   */
  'object.omit': (string[] | string)[];

  /**
   * Compare two objects to each other and get an array of differences
   *
   * Nested object keys are returned as a path array.
   *
   * @example
   * ```yaml
   * object.compare:
   *   - object.from:
   *       name: Alice
   *       age: 25
   *       address:
   *         object.from:
   *           city: Paris
   *           zip: 7500
   *   - object.from:
   *       name: Alice
   *       age: 26
   *       address:
   *         object.from:
   *           city: Lyon
   *           country: France
   * ```
   *
   * Returns:
   * ```javascript
   * [
   *   { path: ['age'], type: 'changed', from: 25, to: 26 },
   *   { path: ['address', 'city'], type: 'changed', from: 'Paris', to: 'Lyon' },
   *   { path: ['address', 'zip'], type: 'removed', value: 7500 },
   *   { path: ['address', 'country'], type: 'added', value: 'France' }
   * ]
   * ```
   */
  'object.compare': [Remapper, Remapper];

  /**
   * Takes an object with an array property and transforms it into an array of objects.
   *
   * Each object in the resulting array contains all the entries of the original object
   * plus all the entries of the corresponding array item from the array property.
   *
   * > **Note**
   * > If one of the items in the array contains a key, which exists in the original object
   * > it will overwrite the original key
   *
   * > **Note**
   * > Nested arrays or objects are not exploded
   *
   * @example
   * Input:
   * ```javascript
   * {
   *   ownerName: 'John',
   *   country: 'USA',
   *   pets: [
   *     { name: 'Milka' },
   *     { name: 'Sven', country: 'Sweden' },
   *     { name: 'Tom', likes: ['mice', 'fish'] },
   *     { name: 'Jerry', looks: { color: 'brown' } }
   *   ]
   * }
   * ```
   *
   * Remapper:
   * ```yaml
   * object.explode: pets
   * ```
   *
   * Returns:
   * ```javascript
   * [
   *   { ownerName: 'John', name: 'Milka', country: 'USA' },
   *   { ownerName: 'John', name: 'Sven', country: 'Sweden' },
   *   { ownerName: 'John', name: 'Tom', country: 'USA', likes: ['mice', 'fish'] },
   *   { ownerName: 'John', name: 'Jerry', country: 'USA', looks: { color: 'brown' } }
   * ]
   * ```
   */
  'object.explode': string;

  /**
   * Use a static value.
   */
  static: any;

  /**
   * Get a property from an object.
   *
   * If the prop is an array, nested properties will be retrieved in sequence.
   */
  prop: number[] | Remapper | string[];

  /**
   * Recursively strip all nullish values from an object or array.
   */
  'null.strip': {
    depth: number;
  } | null;

  /**
   * Pick and return a random entry from an array.
   *
   * If the input is not an array, the input is returned as-is.
   */
  'random.choice': null;

  /**
   * Pick and return a random entry from an array.
   *
   * If the input is not an array, the input is returned as-is.
   */
  'random.integer': [number, number];

  /**
   * Pick and return a random entry from an array.
   *
   * If the input is not an array, the input is returned as-is.
   */
  'random.float': [number, number];

  /**
   * Pick and return a random entry from an array.
   *
   * If the input is not an array, the input is returned as-is.
   */
  'random.string': { choice: string; length: number };

  /**
   * This remapper return true if the provided item is in the input array.
   *
   */
  'array.contains': Remapper;

  /**
   * Join the items of an array using the input separator,
   * If No separator is provided, ',' is used.
   *
   */
  'array.join': string | null;

  /**
   * This remapper return true if the provided string is a substring of the input string.
   *
   */
  'string.contains': string;

  /**
   * This remapper returns the length of the input array or a string, this remapper
   * doesn't require array to be in the context unlike `{ array: length }` remapper.
   */
  len: null;

  /**
   * Get the input data as it was initially passed to the remap function.
   */
  root: null;

  /**
   * Get the data at a certain index from the history stack prior to an action.
   *
   * 0 is the index of the first item in the history stack.
   */
  history: number;

  /**
   * Create a new object with properties from the history stack at a certain index.
   */
  'from.history': {
    /**
     * The index of the history stack item to apply.
     *
     * 0 is the index of the first item in the history stack.
     */
    index: number;

    /**
     * Predefined mapper keys to choose what properties to apply.
     */
    props: Record<string, Remapper>;
  };

  /**
   * Assign properties from the history stack at a certain index to an existing object.
   */
  'assign.history': {
    /**
     * The index of the history stack item to assign.
     *
     * 0 is the index of the first item in the history stack.
     */
    index: number;

    /**
     * Predefined mapper keys to choose what properties to assign.
     */
    props: Record<string, Remapper>;
  };

  /**
   * Assign properties from the history stack at a certain index and exclude the unwanted.
   */
  'omit.history': {
    /**
     * The index of the history stack item to assign.
     *
     * 0 is the index of the first item in the history stack.
     */
    index: number;

    /**
     * Exclude properties from the history stack item, based on the given object keys.
     *
     * Nested properties can be excluded using arrays of keys.
     *
     * @example
     * ```yaml
     * omit.history:
     *   index: 0
     *   keys:
     *     - foo   # Excludes the property foo
     *     - - bar # Excludes the property baz inside of bar
     *       - baz
     * ```
     */
    keys: (string[] | string)[];
  };

  /**
   * Convert an input to lower or upper case.
   */
  'string.case': 'lower' | 'upper';

  /**
   * Check if the initial characters of the string matches with the input string.
   */
  'string.startsWith': SubstringCaseType | string;

  /**
   * Check if the last characters of the string matches with the input string.
   */
  'string.endsWith': SubstringCaseType | string;

  /**
   * Extract a section of the string or an array.
   */
  slice: number | [number, number];

  /**
   * Format a string using remapped input variables.
   */
  'string.format': {
    /**
     * The message id pointing to the template string to format.
     */
    messageId?: Remapper;

    /**
     * The template default string to format.
     */
    template?: string;

    /**
     * A set of remappers to convert the input to usable values.
     */
    values?: Record<string, Remapper>;
  };

  /**
   * Match the content with the regex in the key, and replace it with its value.
   */
  'string.replace': Record<string, string>;

  /**
   * Translate using a messageID.
   *
   * This does not support parameters, for more nuanced translations use `string.format`.
   */
  translate: Remapper;

  container: string;

  /**
   * Construct an OData $filter
   */
  'filter.from': FilterParams;

  /**
   * Construct an OData $orderby
   */
  'order.from': OrderParams;

  /**
   * Parse an xml string to a JavaScript object
   */
  'xml.parse': Remapper;

  /**
   * Check if the value is defined
   *
   * @example
   * "" -> true
   * 0 -> true
   * null -> false
   * undefined -> false
   */
  defined: Remapper;

  /**
   * Perform the specified mathematical operation on the two numbers.
   *
   * Where the position matters, `a` is the first input.
   *
   * If one of the inputs is not a number, or the operation is invalid, `-1` is returned.
   */
  maths: {
    a: Remapper;
    b: Remapper;
    operation: 'add' | 'divide' | 'mod' | 'multiply' | 'subtract';
  };
}

export type ObjectRemapper = RequireExactlyOne<Remappers>;

export type ArrayRemapper = (ArrayRemapper | ObjectRemapper)[];

export type Remapper = ArrayRemapper | ObjectRemapper | boolean | number | string | null;
