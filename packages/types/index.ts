import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type Schema } from 'jsonschema';
import { type OpenAPIV3 } from 'openapi-types';
import { type JsonObject, type RequireExactlyOne } from 'type-fest';

import { type Action, type LogAction } from './action.js';
import { type AppVisibility } from './app.js';
import { type BulmaColor } from './bulma.js';
import { type HTTPMethods } from './http.js';
import { type AppPermission } from './permissions.js';
import { type AppRole, type PredefinedAppRole, type PredefinedOrganizationRole } from './roles.js';
import { type Theme } from './theme.js';

export * from './action.js';
export * from './app.js';
export * from './asset.js';
export * from './authentication.js';
export * from './author.js';
export * from './bulma.js';
export * from './appCollection.js';
export * from './http.js';
export * from './cli.js';
export * from './snapshot.js';
export * from './resource.js';
export * from './saml.js';
export * from './ssl.js';
export * from './template.js';
export * from './theme.js';
export * from './oauth2.js';
export * from './training.js';
export * from './quota.js';
export * from './permissions.js';
export * from './roles.js';

/**
 * A representation of a generated OAuth2 authorization code response.
 */
export interface OAuth2AuthorizationCode {
  /**
   * The authorization code.
   */
  code: string;
}

/**
 * A project that is loaded in an app
 */
export interface ControllerDefinition {
  /**
   * A mapping of actions that can be fired by the project to action handlers.
   *
   * The exact meaning of the parameters depends on the project.
   */
  actions?: Record<string, ActionDefinition>;

  /**
   * Mapping of the events the project can listen to and emit.
   *
   * The exact meaning of the parameters depends on the project.
   */
  events?: {
    listen?: Record<string, string>;
    emit?: Record<string, string>;
  };
}

/**
 * A block that is displayed on a page.
 */
export interface BlockDefinition extends ControllerDefinition {
  /**
   * The type of the controller.
   *
   * A block type follow the format `@organization/project`.
   * If the organization is _appsemble_, it may be omitted.
   *
   * Pattern:
   * ^(@[a-z]([a-z\d-]{0,30}[a-z\d])?\/)?[a-z]([a-z\d-]{0,30}[a-z\d])$
   *
   * Examples:
   * - `empty`
   * - `@amsterdam/empty`
   */
  type: string;

  /**
   * A [semver](https://semver.org) representation of the project version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;

  /**
   * An optional header to render above the block.
   */
  header?: Remapper;

  /**
   * An override of the block’s default layout.
   */
  layout?: 'float' | 'grow' | 'static';

  /**
   * For floating blocks this property defines where the block should float.
   */
  position?:
    | 'bottom left'
    | 'bottom right'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top left'
    | 'top right'
    | 'top';

  /**
   * Whether to render the block or not.
   */
  hide?: Remapper;

  /**
   * The theme of the block.
   */
  theme?: Partial<Theme>;

  /**
   * A list of roles that are allowed to view this block.
   */
  roles?: ViewRole[];

  /**
   * A free form mapping of named parameters.
   *
   * The exact meaning of the parameters depends on the project type.
   */
  parameters?: JsonObject;
}

/**
 * OpenID Connect specifies a set of standard claims about the end-user, which cover common profile
 * information such as name, contact details, date of birth and locale.
 *
 * The Connect2id server can be set up to provide additional custom claims, such as roles and
 * permissions.
 */
export interface BaseUserInfo {
  /**
   * The subject (end-user) identifier. This member is always present in a claims set.
   */
  sub: string;

  /**
   * The full name of the end-user, with optional language tag.
   */
  name: string;

  /**
   * The end-user's preferred email address.
   */
  email: string;

  /**
   * True if the end-user's email address has been verified, else false.
   */
  email_verified: boolean;

  /**
   * The URL of the profile picture for the end-user.
   */
  picture?: string;

  /**
   * The end-user’s locale, represented as a BCP47 language tag.
   */
  locale?: string;

  /**
   * The end-user’s time zone.
   */
  zoneinfo?: string;
}

export interface UserInfo extends BaseUserInfo {
  /**
   * If the user is subscribed to the newsletter
   */
  subscribed?: boolean;
  hasPassword?: boolean;
}

export interface AppMemberInfo extends BaseUserInfo {
  /**
   * The role of the app member.
   */
  role: AppRole;

  /**
   * The end-user's additional properties
   */
  properties?: Record<string, any>;

  /**
   * Whether this app member is used for demonstration purposes
   */
  demo: boolean;
}

export interface SSOConfiguration {
  type: 'oauth2' | 'saml';
  url: string;
  icon: IconName;
  name: string;
}

export interface AppAccount {
  app: App;
  appMemberInfo: AppMemberInfo;
  sso: SSOConfiguration[];
}

export interface EmailAuthorization {
  email: string;
  verified: boolean;
}

/**
 * The payload stored in our JSON web tokens
 */
export interface JwtPayload {
  aud: string;
  exp: number;
  iat: string;
  iss: string;
  scope: string;
  sub: string;
}

/**
 * A response for a login token request
 */
export interface TokenResponse {
  /**
   * The bearer access token to use for authenticating requests.
   */
  access_token: string;

  /**
   * How long until the access token expires in seconds from now.
   */
  expires_in?: number;

  /**
   * The OpenID ID token as a JWT.
   *
   * This field is only present on OpenID connect providers.
   */
  id_token?: string;

  /**
   * A refresh token for getting a new access token.
   */
  refresh_token?: string;

  token_type: 'bearer';
}

/**
 * A type to represent the app lock.
 */
export type AppLock = 'fullLock' | 'studioLock' | 'unlocked';

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
  'app.member': keyof AppMemberInfo;

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
   */
  page: 'data' | 'url';

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
  translate: string;

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
}

export type ObjectRemapper = RequireExactlyOne<Remappers>;

export type ArrayRemapper = (ArrayRemapper | ObjectRemapper)[];

export type Remapper = ArrayRemapper | ObjectRemapper | boolean | number | string | null;

export interface SubscriptionResponseResource {
  create: boolean;
  update: boolean;
  delete: boolean;
  subscriptions?: Record<
    string,
    {
      create?: boolean;
      update: boolean;
      delete: boolean;
    }
  >;
}

export type SubscriptionResponse = Record<string, SubscriptionResponseResource>;

export const resourceSubscribableAction = ['create', 'update', 'delete'] as const;

export type ResourceSubscribableAction = (typeof resourceSubscribableAction)[number];

export type ResourceViewAction = 'get' | 'query';

export type OwnResourceAction = ResourceViewAction | 'delete' | 'patch' | 'update';

export type ResourceAction =
  | ResourceViewAction
  | 'create'
  | 'delete'
  | 'history.get'
  | 'patch'
  | 'update.positions'
  | 'update';

export type CustomAppResourcePermission = `$resource:${string}:${ResourceAction}`;

export type CustomAppOwnResourcePermission = `$resource:${string}:own:${OwnResourceAction}`;

export type CustomAppResourceViewPermission = `$resource:${string}:${ResourceViewAction}:${string}`;

export type CustomAppGuestPermission =
  | AppPermission
  | CustomAppResourcePermission
  | CustomAppResourceViewPermission;

export type CustomAppPermission = CustomAppGuestPermission | CustomAppOwnResourcePermission;

export interface GuestDefinition {
  permissions?: CustomAppPermission[];
  inherits?: AppRole[];
}

export interface CronSecurityDefinition {
  permissions?: CustomAppPermission[];
  inherits?: AppRole[];
}

export interface RoleDefinition {
  description?: string;
  defaultPage?: string;
  inherits?: AppRole[];
  permissions?: CustomAppPermission[];
}

export type SecurityPolicy = 'everyone' | 'invite' | 'organization';

export interface MinimalSecurity {
  guest: GuestDefinition;

  cron?: CronSecurityDefinition;
  default?: {
    role: AppRole;
    policy?: SecurityPolicy;
  };

  roles?: Record<Exclude<string, PredefinedAppRole>, RoleDefinition>;
}

export interface StrictSecurity {
  guest?: GuestDefinition;

  cron?: CronSecurityDefinition;
  default: {
    role: AppRole;
    policy?: SecurityPolicy;
  };

  roles: Record<string, RoleDefinition>;
}

export type Security = MinimalSecurity | StrictSecurity;

export type Navigation = 'bottom' | 'hidden' | 'left-menu';
export type LayoutPosition = 'hidden' | 'navbar' | 'navigation';

export interface NotificationDefinition {
  to?: string[];
  subscribe?: 'all' | 'both' | 'single';
  data?: {
    title: string;
    content: string;
    link: string;
  };
}

/**
 * A collection of hooks that are triggered upon calling a resource actions.
 */
export interface ResourceHooks {
  notification: NotificationDefinition;
}

export interface ResourceCall {
  /**
   * The HTTP method to use for making the HTTP request.
   */
  method?: HTTPMethods;

  /**
   * The URL to which to make the resource request.
   */
  url?: string;

  /**
   * The associated hooks with the resource action.
   */
  hooks?: ResourceHooks;

  /**
   * Query parameters to pass along with the request.
   */
  query?: Remapper;
}

export interface ResourceReferenceActionTrigger {
  type: 'create' | 'delete' | 'update';
  cascade?: 'delete' | 'update';
}

interface ResourceReferenceAction {
  triggers: ResourceReferenceActionTrigger[];
}

export interface ResourceReference {
  /**
   * The name of the referenced resource.
   */
  resource: string;

  create?: ResourceReferenceAction;
  update?: ResourceReferenceAction;
  delete?: ResourceReferenceAction;
}

export interface ResourceHistoryDefinition {
  /**
   * If set to `false`, edits are still tracked, but exactly what changed is lost.
   */
  data: boolean;
}

export interface ResourceView {
  /**
   * The remappers used to transform the output.
   */
  remap: Remapper;
}

export interface AppMemberPropertyDefinition {
  /**
   * The JSON schema to validate user properties against before sending it to the backend.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The resource that is referenced by this user property.
   */
  reference?: {
    resource: string;
  };
}

export interface ResourceDefinition {
  /**
   * A definition of how versioning should happen for instances of this resource.
   */
  history?: ResourceHistoryDefinition | boolean;

  /**
   * Whether to enable position column for the instances of this resource. This is used for keeping
   * an ordered list to enable custom sorting of the data using drag and drop features.
   */
  positioning?: boolean;

  /**
   * Enforce Custom Ordering By the fields.
   */
  enforceOrderingGroupByFields?: string[];

  /**
   * The definition for the `resource.create` action.
   */
  create?: ResourceCall;

  /**
   * The definition for the `resource.delete` action.
   */
  delete?: ResourceCall;

  /**
   * The definition for the `resource.get` action.
   */
  get?: ResourceCall;

  /**
   * The definition for the `resource.query` action.
   */
  query?: ResourceCall;

  /**
   * The definition for the `resource.count` action.
   */
  count?: ResourceCall;

  /**
   * The definition for the `resource.update` action.
   */
  update?: ResourceCall;

  /**
   * The definition for the `resource.patch` action.
   */
  patch?: ResourceCall;

  /**
   * The property to use as the id.
   *
   * @default `id`
   */
  id?: string;

  /**
   * The JSON schema to validate resources against before sending it to the backend.
   */
  schema: OpenAPIV3.SchemaObject;

  /**
   * The URL to post the resource to.
   *
   * @default autogenerated for use with the Appsemble resource API.
   */
  url?: string;

  /**
   * The alternate views of this resource.
   */
  views?: Record<string, ResourceView>;

  /**
   * The references this resources has to other resources.
   */
  references?: Record<string, ResourceReference>;

  /**
   * A time string representing when a resource should expire.
   *
   * @example '1d 8h 30m'
   */
  expires?: string;

  /**
   * Whether the resource should be able to be transferred when cloning the app it belongs to.
   */
  clonable?: boolean;
}

export interface BaseActionDefinition<T extends Action['type']> {
  /**
   * The type of the action.
   */
  type: T;

  /**
   * A remapper function. This may be used to remap data before it is passed into the action
   * function.
   *
   * @deprecated Since 0.20.10, use {@link remapBefore} instead.
   */
  remap?: Remapper;

  /**
   * A remapper function. This may be used to remap data before it is passed into the action
   * function.
   */
  remapBefore?: Remapper;

  /**
   * The remapper used to transform the output before passing it to the next action.
   */
  remapAfter?: Remapper;

  /**
   * Another action that is dispatched when the action has been dispatched successfully.
   */
  onSuccess?: ActionDefinition;

  /**
   * Another action that is dispatched when the action has failed to dispatch successfully.
   */
  onError?: ActionDefinition;
}

export interface AnalyticsAction extends BaseActionDefinition<'analytics'> {
  /**
   * The analytics event target name.
   */
  target: string;

  /**
   * Additional config to pass to analytics.
   */
  config?: Remapper;
}

export interface ConditionActionDefinition extends BaseActionDefinition<'condition'> {
  /**
   * The condition to check for.
   */
  if: Remapper;

  /**
   * The action to run if the condition is true.
   */
  then: ActionDefinition;

  /**
   * The action to run if the condition is false.
   */
  else: ActionDefinition;
}

export interface MatchActionDefinition extends BaseActionDefinition<'match'> {
  /**
   * Run another action if one of the cases is true.
   *
   * Only the first case that equals true is called.
   */
  match: {
    /**
     * The case to be matched.
     */
    case: Remapper;

    /**
     * Action to be called if the case equals true.
     */
    action: ActionDefinition;
  }[];
}

export interface DialogActionDefinition extends BaseActionDefinition<'dialog'> {
  /**
   * If false, the dialog cannot be closed by clicking outside of the dialog or on the close button.
   */
  closable?: boolean;

  /**
   * If true, the dialog will be displayed full screen.
   */
  fullscreen?: boolean;

  /**
   * Blocks to render on the dialog.
   */
  blocks: BlockDefinition[];

  /**
   * The title to show in the dialog.
   */
  title?: Remapper;
}

export interface DownloadActionDefinition extends BaseActionDefinition<'download'> {
  /**
   * The filename to download the file as. It must include a file extension.
   */
  filename: string;
}

export interface EachActionDefinition extends BaseActionDefinition<'each'> {
  /**
   * Run the actions in series instead of parallel.
   */
  serial?: boolean;

  /**
   * Run an action for each entry in an array.
   *
   * The actions are run in parallel.
   *
   * If the input is not an array, the action will be applied to the input instead.
   */
  do: ActionDefinition;
}

export interface EmailActionDefinition extends BaseActionDefinition<'email'> {
  /**
   * The recipient of the email.
   */
  to?: Remapper;

  /**
   * The name of the sender.
   *
   * The default value depends on the email server.
   */
  from?: Remapper;

  /**
   * The recipients to CC the email to.
   */
  cc?: Remapper;

  /**
   * The recipients to BCC the email to.
   */
  bcc?: Remapper;

  /**
   * The subject of the email.
   */
  subject: Remapper;

  /**
   * The body of the email.
   */
  body: Remapper;

  /**
   * The attachments to include in the email.
   *
   * The remapper must resolve to an object containing the following properties:
   *
   * - \`target\`: The asset ID or link to download contents from to add as an attachment. This is
   * mutually exclusive with \`content\`.
   * - \`content\`: The raw content to include as the file content. This is mutually exclusive with
   * \`target\`.
   * - \`filename\`: The filename to include the attachment as.
   * - \`accept\` If the target is a URL, this will be set as the HTTP \`Accept\` header when
   * downloading the file.
   *
   * If the attachment is a string, it will be treated as the target.
   */
  attachments?: Remapper;
}

export interface FlowToActionDefinition extends BaseActionDefinition<'flow.to'> {
  /**
   * The flow step to go to.
   */
  step: Remapper;
}

export interface LinkActionDefinition extends BaseActionDefinition<'link'> {
  /**
   * Where to link to.
   *
   * This should be a page name.
   */
  to: Remapper | string[] | string;
}

export interface NotifyActionDefinition extends BaseActionDefinition<'notify'> {
  /**
   * The title of the notification.
   */
  title: Remapper;

  /**
   * The description of the notification.
   */
  body: Remapper;

  /**
   * To whom the notification should be sent.
   *
   * Use `all` to send the notification to all app subscribed users.
   * Or notify specific users by passing either a single user id or an array of user ids.
   *
   * Nothing is sent if the value is **not** a valid user id.
   */
  to: Remapper;
}

export interface LogActionDefinition extends BaseActionDefinition<'log'> {
  /**
   * The logging level on which to log.
   *
   * @default `info`.
   */
  level?: LogAction['level'];
}

export interface ShareActionDefinition extends BaseActionDefinition<'share'> {
  /**
   * The URL that is being shared.
   */
  url?: Remapper;

  /**
   * The main body that is being shared.
   */
  text?: Remapper;

  /**
   * The title that is being shared, if supported.
   */
  title?: Remapper;
}

export type StorageType = 'appStorage' | 'indexedDB' | 'localStorage' | 'sessionStorage';

export interface StorageAppendActionDefinition extends BaseActionDefinition<'storage.append'> {
  /**
   * The key of the entry to write to the app’s storage.
   */
  key: Remapper;

  /**
   * The data to write to the app’s storage.
   */
  value: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageDeleteActionDefinition extends BaseActionDefinition<'storage.delete'> {
  /**
   * The key of the entry to delete from the app’s storage.
   */
  key: Remapper;

  /**
   * The mechanism used to delete the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageSubtractActionDefinition extends BaseActionDefinition<'storage.subtract'> {
  /**
   * The key of the entry to subtract the last entry from
   */
  key: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageUpdateActionDefinition extends BaseActionDefinition<'storage.update'> {
  /**
   * The key of the entry to write to the app’s storage.
   */
  key: Remapper;

  /**
   * The key of the item to update.
   */
  item: Remapper;

  /**
   * The data to update the specified item with.
   */
  value: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageReadActionDefinition extends BaseActionDefinition<'storage.read'> {
  /**
   * The key of the entry to read from the app’s storage.
   */
  key: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;
}

export interface StorageWriteActionDefinition extends BaseActionDefinition<'storage.write'> {
  /**
   * The key of the entry to write to the app’s storage.
   */
  key: Remapper;

  /**
   * The data to write to the app’s storage.
   */
  value: Remapper;

  /**
   * The mechanism used to read the data from.
   *
   * @default 'indexedDB'
   */
  storage?: StorageType;

  /**
   * Expiry of the data stored, to be used with `localStorage`.
   */
  expiry?: '1d' | '3d' | '7d' | '12h';
}

export interface GroupMemberInviteActionDefinition
  extends BaseActionDefinition<'group.member.invite'> {
  /**
   * The ID of the group to invite the user to.
   */
  id: Remapper;

  /**
   * The email address of the user to invite.
   */
  email: Remapper;

  /**
   * The role of the invited group member.
   */
  role: Remapper;
}

export interface GroupMemberQueryActionDefinition
  extends BaseActionDefinition<'group.member.query'> {
  /**
   * The ID of the group to query the members of.
   */
  id: Remapper;
}

export interface GroupMemberDeleteActionDefinition
  extends BaseActionDefinition<'group.member.delete'> {
  /**
   * The ID of the group member to delete.
   */
  id: Remapper;
}

export interface GroupMemberRoleUpdateActionDefinition
  extends BaseActionDefinition<'group.member.role.update'> {
  /**
   * The ID of the group member to update the role of.
   */
  id: Remapper;

  /**
   * The role to invite the app member with.
   */
  role: Remapper;
}

export interface AppMemberLoginAction extends BaseActionDefinition<'app.member.login'> {
  /**
   * The email address to log in with.
   */
  email: Remapper;

  /**
   * The password to log in with.
   */
  password: Remapper;
}

export interface AppMemberRegisterAction extends BaseActionDefinition<'app.member.register'> {
  /**
   * The email address to register with.
   */
  email: Remapper;

  /**
   * The password to login with.
   */
  password: Remapper;

  /**
   * The full name of the app member.
   */
  name: Remapper;

  /**
   * The profile picture to use.
   *
   * This must be a file, otherwise it’s discarded.
   */
  picture?: Remapper;

  /**
   * Custom properties that can be assigned freely.
   *
   * Every value will be converted to a string.
   */
  properties?: Remapper;

  /**
   * Whether to login after registering.
   *
   * @default true
   */
  login?: boolean;
}

export interface AppMemberInviteAction extends BaseActionDefinition<'app.member.invite'> {
  /**
   * The email address to invite the app member with.
   */
  email: Remapper;

  /**
   * The role to invite the app member with.
   */
  role: Remapper;
}

export interface AppMemberQueryAction extends BaseActionDefinition<'app.member.query'> {
  /**
   * The roles of the users to fetch.
   */
  roles?: Remapper;
}

export interface AppMemberRoleUpdateAction extends BaseActionDefinition<'app.member.role.update'> {
  /**
   * The id of the app member to update.
   */
  sub: Remapper;

  /**
   * The role of the updated app member
   */
  role: Remapper;
}

export interface AppMemberPropertiesPatchAction
  extends BaseActionDefinition<'app.member.properties.patch'> {
  /**
   * The id of the app member to update.
   */
  sub: Remapper;

  /**
   * Custom properties that can be assigned freely.
   *
   * Every value will be converted to a string.
   */
  properties: Remapper;
}

export interface AppMemberCurrentPatchAction
  extends BaseActionDefinition<'app.member.current.patch'> {
  /**
   * The display name to update.
   */
  name?: Remapper;

  /**
   * Custom properties that can be assigned freely.
   *
   * Every value will be converted to a string.
   */
  properties?: Remapper;

  /**
   * The profile picture to use.
   *
   * This must be a file, otherwise it’s discarded.
   */
  picture?: Remapper;
}

export interface AppMemberDeleteAction extends BaseActionDefinition<'app.member.delete'> {
  /**
   * The id of the app member to remove.
   */
  sub: Remapper;
}

interface RequestActionHeaders {
  'Content-Type':
    | 'application/x-www-form-urlencoded'
    | 'application/xml'
    | 'multipart/form-data'
    | 'text/plain';
}

export interface RequestLikeActionDefinition<T extends Action['type'] = Action['type']>
  extends BaseActionDefinition<T> {
  /**
   * The HTTP method to use for making a request.
   */
  method?: HTTPMethods;

  /**
   * Whether or not to proxy the request through the Appsemble proxy endpoint.
   *
   * @default true
   */
  proxy?: boolean;

  /**
   * A JSON schema against which to validate data before uploading.
   */
  schema?: OpenAPIV3.SchemaObject;

  /**
   * Query parameters to pass along with the request.
   */
  query?: Remapper;

  /**
   * The URL to which to make the request.
   */
  url?: Remapper;

  /**
   * A remapper for the request body.
   *
   * If this isn’t specified, the raw input data is used.
   */
  body?: Remapper;

  /**
   * Headers for the outgoing request.
   */
  headers?: RequestActionHeaders;
}

export interface ResourceActionDefinition<T extends Action['type']>
  extends RequestLikeActionDefinition<T> {
  /**
   * The name of the resource.
   */
  resource: string;
}

interface ViewResourceDefinition {
  /**
   * The view to use for the request.
   */
  view?: string;
}

interface OwnResourceDefinition {
  /**
   * If only the resources created by the authenticated app member should be included
   */
  own?: boolean;
}

interface ResourceActionWithIdDefinition {
  /**
   * Id of the resource to fetch
   */
  id?: Remapper;
}

export interface ControllerActionDefinition extends BaseActionDefinition<'controller'> {
  handler: string;
}

export type RequestActionDefinition = RequestLikeActionDefinition<'request'>;
export type ResourceCreateActionDefinition = ResourceActionDefinition<'resource.create'>;
export type ResourceDeleteActionDefinition = ResourceActionDefinition<'resource.delete'>;
export type ResourceDeleteAllActionDefinition = ResourceActionDefinition<'resource.delete.all'>;
export type ResourceDeleteBulkActionDefinition = ResourceActionDefinition<'resource.delete.bulk'>;
export type ResourceHistoryGetActionDefinition = ResourceActionDefinition<'resource.history.get'>;
export type ResourceGetActionDefinition = ResourceActionDefinition<'resource.get'> &
  ResourceActionWithIdDefinition &
  ViewResourceDefinition;
export type ResourceQueryActionDefinition = OwnResourceDefinition &
  ResourceActionDefinition<'resource.query'> &
  ViewResourceDefinition;
export type ResourceCountActionDefinition = OwnResourceDefinition &
  ResourceActionDefinition<'resource.count'>;
export type ResourceUpdateActionDefinition = ResourceActionDefinition<'resource.update'>;
export type ResourceUpdatePositionsActionDefinition =
  ResourceActionDefinition<'resource.update.positions'> & ResourceActionWithIdDefinition;
export type ResourcePatchActionDefinition = ResourceActionDefinition<'resource.patch'> &
  ResourceActionWithIdDefinition;
export type AppMemberLogoutAction = BaseActionDefinition<'app.member.logout'>;

export interface BaseResourceSubscribeActionDefinition<T extends Action['type']>
  extends BaseActionDefinition<T> {
  /**
   * The name of the resource.
   */
  resource: string;

  /**
   * The action to subscribe to. Defaults to `update` if not specified.
   */
  action?: 'create' | 'delete' | 'update';
}

export type ResourceSubscriptionSubscribeActionDefinition =
  BaseResourceSubscribeActionDefinition<'resource.subscription.subscribe'>;

export type ResourceSubscriptionUnsubscribeActionDefinition =
  BaseResourceSubscribeActionDefinition<'resource.subscription.unsubscribe'>;

export type ResourceSubscriptionToggleActionDefinition =
  BaseResourceSubscribeActionDefinition<'resource.subscription.toggle'>;

export type ResourceSubscriptionStatusActionDefinition = Omit<
  BaseResourceSubscribeActionDefinition<'resource.subscription.status'>,
  'action'
>;

export interface EventActionDefinition extends BaseActionDefinition<'event'> {
  /**
   * The name of the event to emit to.
   */
  event: string;

  /**
   * An event to wait for before resolving.
   *
   * If this is unspecified, the action will resolve with the input data.
   */
  waitFor?: string;
}

export interface StaticActionDefinition extends BaseActionDefinition<'static'> {
  /**
   * The value to return.
   */
  value: any;
}

export interface BaseMessage {
  /**
   * The color to use for the message.
   *
   * @default 'info'
   */
  color?: BulmaColor;

  /**
   * The timeout period for this message (in milliseconds).
   *
   * @default 5000
   */
  timeout?: number;

  /**
   * Whether or not to show the dismiss button.
   *
   * @default false
   */
  dismissable?: boolean;

  /**
   * The position of the message on the screen.
   *
   * @default 'bottom'
   */
  layout?: 'bottom' | 'top';
}

export type MessageActionDefinition = BaseActionDefinition<'message'> &
  BaseMessage & {
    /**
     * The content of the message to display.
     */
    body: Remapper;
  };

export type ActionDefinition =
  | AnalyticsAction
  | AppMemberCurrentPatchAction
  | AppMemberDeleteAction
  | AppMemberInviteAction
  | AppMemberLoginAction
  | AppMemberLogoutAction
  | AppMemberPropertiesPatchAction
  | AppMemberQueryAction
  | AppMemberRegisterAction
  | AppMemberRoleUpdateAction
  | BaseActionDefinition<'dialog.error'>
  | BaseActionDefinition<'dialog.ok'>
  | BaseActionDefinition<'flow.back'>
  | BaseActionDefinition<'flow.cancel'>
  | BaseActionDefinition<'flow.finish'>
  | BaseActionDefinition<'flow.next'>
  | BaseActionDefinition<'group.query'>
  | BaseActionDefinition<'link.back'>
  | BaseActionDefinition<'link.next'>
  | BaseActionDefinition<'noop'>
  | BaseActionDefinition<'throw'>
  | ConditionActionDefinition
  | ControllerActionDefinition
  | DialogActionDefinition
  | DownloadActionDefinition
  | EachActionDefinition
  | EmailActionDefinition
  | EventActionDefinition
  | FlowToActionDefinition
  | GroupMemberDeleteActionDefinition
  | GroupMemberInviteActionDefinition
  | GroupMemberQueryActionDefinition
  | GroupMemberRoleUpdateActionDefinition
  | LinkActionDefinition
  | LogActionDefinition
  | MatchActionDefinition
  | MessageActionDefinition
  | NotifyActionDefinition
  | RequestActionDefinition
  | ResourceCountActionDefinition
  | ResourceCreateActionDefinition
  | ResourceDeleteActionDefinition
  | ResourceDeleteAllActionDefinition
  | ResourceDeleteBulkActionDefinition
  | ResourceGetActionDefinition
  | ResourceHistoryGetActionDefinition
  | ResourcePatchActionDefinition
  | ResourceQueryActionDefinition
  | ResourceSubscriptionStatusActionDefinition
  | ResourceSubscriptionSubscribeActionDefinition
  | ResourceSubscriptionToggleActionDefinition
  | ResourceSubscriptionUnsubscribeActionDefinition
  | ResourceUpdateActionDefinition
  | ResourceUpdatePositionsActionDefinition
  | ShareActionDefinition
  | StaticActionDefinition
  | StorageAppendActionDefinition
  | StorageDeleteActionDefinition
  | StorageReadActionDefinition
  | StorageSubtractActionDefinition
  | StorageUpdateActionDefinition
  | StorageWriteActionDefinition;

export interface ActionType {
  /**
   * Whether or not app creators are required to define this action.
   */
  required?: boolean;

  /**
   * The description of the action.
   */
  description?: string;
}

export interface EventType {
  /**
   * The description of the action.
   */
  description?: string;
}

export type ViewRole = AppRole | '$guest';

/**
 * This describes what a page will look like in the app.
 */
export interface BasePageDefinition {
  /**
   * The name of the page.
   *
   * This will be displayed at the *app bar* of each page and in the side menu,
   * unless @see navTitle is set.
   *
   * The name of the page is used to determine the URL path of the page.
   */
  name: string;

  /**
   * Whether or not the page name should be displayed in the *app bar*.
   */
  hideName?: boolean;

  /**
   * The name of the page when displayed in the navigation menu.
   *
   * Context property `name` can be used to access the name of the page.
   */
  navTitle?: Remapper;

  /**
   * Whether or not the page should be displayed in navigational menus.
   */
  hideNavTitle?: boolean;

  /**
   * The navigation type to use for the page.
   * Setting this will override the default navigation for the app.
   */
  navigation?: Navigation;

  /**
   * A list of roles that may view the page.
   */
  roles?: ViewRole[];

  /**
   * An optional icon from the fontawesome icon set
   *
   * This will be displayed in the navigation menu.
   */
  icon?: IconName;

  /**
   * Page parameters can be used for linking to a page that should display a single resource.
   */
  parameters?: string[];

  /**
   * The global theme for the page.
   */
  theme?: Partial<Theme>;

  /**
   * A Remapper that resolves to a number to be visible in the side-menu.
   */
  badgeCount?: Remapper;

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: {
    onLoad?: ActionDefinition;
  };
}

/**
 * A subset of page for use within flow pages and tab pages.
 */
export interface SubPageDefinition {
  name: Remapper;
  roles?: ViewRole[];
  blocks: BlockDefinition[];
}

export interface BasicPageDefinition extends BasePageDefinition {
  type?: 'page';
  blocks: BlockDefinition[];
}

export interface ContainerPageDefinition extends BasePageDefinition {
  type: 'container';
  pages: PageDefinition[];
}

export interface FlowPageDefinition extends Omit<BasePageDefinition, 'actions'> {
  type: 'flow';

  steps: SubPageDefinition[];

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: {
    onFlowCancel?: ActionDefinition;
    onFlowFinish?: ActionDefinition;
  };

  /**
   * The method used to display the progress of the flow page.
   *
   * @default 'corner-dots'
   */
  progress?: 'corner-dots' | 'hidden';

  /**
   * Whether to retain the flow data when navigating away to another page outside the flow.
   *
   * By default the flow page retains it's data after navigating once. Set to false to clear it.
   *
   * @default true
   */
  retainFlowData?: boolean;
}

export interface LoopPageDefinition extends BasePageDefinition {
  type: 'loop';

  /**
   * Template step that the loop will pass data onto
   */
  foreach: SubPageDefinition;

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: {
    onFlowCancel?: ActionDefinition;
    onFlowFinish?: ActionDefinition;
    onLoad: ActionDefinition;
  };

  /**
   * The method used to display the progress of the flow page.
   *
   * @default 'corner-dots'
   */
  progress?: 'corner-dots' | 'hidden';

  /**
   * Whether to retain the flow data when navigating away to another page outside the flow.
   *
   * By default the flow page retains it's data after navigating once. Set to false to clear it.
   *
   * @default true
   */
  retainFlowData?: boolean;
}

export interface AlternateTabsDefinition {
  foreach: SubPageDefinition;
  events: {
    listen?: Record<string, string>;
    emit?: Record<string, string>;
  };
}

export interface TabsPageDefinition extends BasePageDefinition {
  type: 'tabs';
  tabs?: SubPageDefinition[];
  definition?: AlternateTabsDefinition;

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: {
    onLoad?: ActionDefinition;
  };
}

export type PageDefinition =
  | BasicPageDefinition
  | ContainerPageDefinition
  | FlowPageDefinition
  | LoopPageDefinition
  | TabsPageDefinition;

export interface AppDefinition {
  /**
   * The name of the app.
   *
   * This determines the default path of the app.
   */
  name: string;

  /**
   * The description of the app.
   */
  description?: string;

  /**
   * The default language of the app.
   *
   * @default 'en'
   */
  defaultLanguage?: string;

  /**
   * The security definition of the app.
   *
   * This determines user roles and login behavior.
   */
  security?: Security;

  /**
   * The default page of the app.
   */
  defaultPage: string;

  /**
   * The settings for the layout of the app.
   */
  layout?: {
    /**
     * The location of the login button.
     *
     * @default 'navbar'
     */
    login?: LayoutPosition;

    /**
     * The location of the settings button.
     *
     * If set to `navigation`, it will only be visible if `login` is also visible in `navigation`.
     *
     * @default 'navbar'
     */
    settings?: LayoutPosition;

    /**
     * The location of the feedback button
     *
     * If set to `navigation`, it will only be visible if `login` is also visible in `navigation`.
     *
     * @default 'navbar'
     */
    feedback?: LayoutPosition;

    /**
     * The location of the install button.
     *
     * If set to `navigation`, it will only be visible if `login` is also visible in `navigation`.
     *
     * @default 'navbar'
     */
    install?: LayoutPosition;

    /**
     * The navigation type to use.
     *
     * If this is omitted, a collapsible side navigation menu will be rendered on the left.
     *
     * @default 'left-menu'
     */
    navigation?: Navigation;
  };

  /**
   * The strategy to use for apps to subscribe to push notifications.
   *
   * If this is omitted, push notifications can not be sent.
   */
  notifications?: 'login' | 'opt-in' | 'startup';

  /**
   * The pages of the app.
   */
  pages: PageDefinition[];

  controller?: ControllerDefinition;

  members?: {
    properties: Record<string, AppMemberPropertyDefinition>;
  };

  /**
   * Resource definitions that may be used by the app.
   */
  resources?: Record<string, ResourceDefinition>;

  /**
   * The global theme for the app.
   */
  theme?: Partial<Theme>;

  /**
   * Helper property that can be used to store YAML anchors.
   *
   * This is omitted any time the API serves the app definition.
   */
  anchors?: any[];

  /**
   * Cron jobs associated with the app.
   */
  cron?: Record<string, CronDefinition>;

  /**
   * Webhooks associated with the app.
   */
  webhooks?: Record<string, WebhookDefinition>;

  /**
   * Companion containers of the app.
   */
  containers?: CompanionContainerDefinition[];

  /**
   * Default registry to use when creating app companion containers.
   * Used to avoid writing the registry name in front of every image.
   */
  registry?: string;
}

/**
 * The definition of a cron job for an app.
 */
export interface CronDefinition {
  schedule: string;
  action: ActionDefinition;
}

/**
 * The definition of a webhook for an app.
 */
export interface WebhookDefinition {
  schema: OpenAPIV3.SchemaObject;
  action: ActionDefinition;
}

export interface App {
  /**
   * The unique identifier for the app.
   *
   * This value will be generated automatically by the API.
   */
  id?: number;

  /**
   * A domain name on which this app should be served.
   */
  domain?: string | null;

  /**
   * The name used for emails
   */
  emailName?: string;

  /**
   * The id of the organization this app belongs to.
   */
  OrganizationId: string;

  /**
   * The name of the organization this app belongs to.
   */
  OrganizationName?: string;

  /**
   * The path the app is available from.
   */
  path: string;

  /**
   * Visibility of the app in the public app store.
   */
  visibility: AppVisibility;

  /**
   * Whether or not the app definition is exposed for display in Appsemble Studio.
   */
  showAppDefinition: boolean;

  /**
   * The Google analytics ID of the app.
   */
  googleAnalyticsID?: string;

  /**
   * Whether the app is currently locked.
   */
  locked: AppLock;

  /**
   * Whether the app is a template.
   */
  template?: boolean;

  /**
   * Whether to apply service secrets to outgoing request even without a security definition.
   */
  enableUnsecuredServiceSecrets: boolean;

  /**
   * Whether the Appsemble password login method should be shown.
   */
  showAppsembleLogin: boolean;

  /**
   * Whether to display App member's name in the title bar.
   */
  displayAppMemberName: boolean;

  /**
   * Whether to display the installation prompt to the app members.
   */
  displayInstallationPrompt: boolean;

  /**
   * Whether the Appsemble OAuth2 login method should be shown.
   */
  showAppsembleOAuth2Login: boolean;

  /**
   * Whether new users should be able to register themselves.
   */
  enableSelfRegistration: boolean;

  /**
   * The Sentry DSN of the app.
   */
  sentryDsn?: string;

  /**
   * The Sentry environment associated with the Sentry DSN.
   */
  sentryEnvironment?: string;

  /**
   * The app definition.
   */
  definition: AppDefinition;

  /**
   * The app definition formatted as YAML.
   */
  yaml?: string;

  /**
   * An app rating.
   */
  rating?: {
    /**
     * The number of people who rated the app.
     */
    count: number;

    /**
     * The average app rating.
     */
    average: number;
  };

  /**
   * Whether the app has clonable resources.
   */
  hasClonableResources?: boolean;

  /**
   * Whether the app has clonable assets.
   */
  hasClonableAssets?: boolean;

  /**
   * A list of URLs to app screenshots
   */
  screenshotUrls?: string[];

  /**
   * A URL to the long description of the app based on language
   */
  readmeUrl?: string;

  /**
   * True if the app has its own icon.
   */
  hasIcon: boolean;

  /**
   * True if the app supports a maskable icon.
   */
  hasMaskableIcon: boolean;

  /**
   * The background color used for maskable icons.
   */
  iconBackground: string;

  /**
   * An app icon url
   */
  iconUrl?: string;

  /**
   * The creation date of the app.
   */
  $created?: string;

  /**
   * The date when the app was last updated.
   */
  $updated?: string;

  /**
   * Any pre-included translations of the app.
   */
  messages?: AppsembleMessages;

  /**
   * The build app controller's code
   */
  controllerCode?: string;

  /**
   * The build app controller's manifest
   */
  controllerImplementations?: ProjectImplementations;

  /**
   * Any app styles that are shared.
   */
  sharedStyle?: string;

  /**
   * Any app styles that are core.
   */
  coreStyle?: string;

  /**
   * Whether the app should be used in demo mode.
   */
  demoMode: boolean;
}

/**
 * A rating given to an app.
 */
export interface Rating {
  /**
   * A value ranging between 1 and 5 representing the rating
   */
  rating: number;

  /**
   * An optional description of why the rating was given
   */
  description?: string;

  /**
   * The name of the user who rated the app.
   */
  name: string;

  /**
   * The ID of the user who rated the app.
   */
  UserId: string;

  /**
   * The creation date of the rating.
   */
  $created: string;

  /**
   * The date of the last time the rating was updated
   */
  $updated: string;
}

/**
 * The representation of an organization within Appsemble.
 */
export interface Organization {
  /**
   * The ID of the organization.
   *
   * This typically is prepended with an `@`
   */
  id: string;

  /**
   * The display name of the organization.
   */
  name: string;

  /**
   * The description of the organization.
   */
  description: string;

  /**
   * The website of the organization.
   */
  website: string;

  /**
   * The email address that can be used to contact the organization.
   */
  email: string;

  /**
   * The URL at which the organization’s icon can be found.
   */
  iconUrl: string;
}

/**
 * An invite for an organization.
 */
export interface OrganizationInvite {
  /**
   * The email address of the user to invite.
   */
  email: string;

  /**
   * The role the user should get when accepting the invite.
   */
  role: PredefinedOrganizationRole;
}

/**
 * An invite for an app.
 */
export interface AppInvite {
  /**
   * The email address of the app member to invite.
   */
  email: string;

  /**
   * The role the app member should get when accepting the invite.
   */
  role: string;
}

/**
 * An invite for a group.
 */
export interface GroupInvite {
  /**
   * The name of the group.
   */
  groupId?: number;

  /**
   * The name of the group.
   */
  groupName?: string;

  /**
   * The email address of the group member to invite.
   */
  email: string;

  /**
   * The role the group member should get when accepting the invite.
   */
  role: AppRole;
}

/**
 * Represents a group within an organization.
 */
export interface Group {
  /**
   * The ID of the group.
   */
  id: number;

  /**
   * The display name of the group.
   */
  name: string;

  /**
   * Custom annotations for the group.
   */
  annotations?: Record<string, string>;
}

/**
 * Group member in a group.
 */
export interface GroupMember {
  id: string;
  role: string;
  name: string;
  email: string;
}

export interface AppMemberGroup {
  /**
   * The ID of the group.
   */
  id: number;

  /**
   * The display name of the group.
   */
  name: string;

  /**
   * The role of the app member inside the group.
   */
  role: AppRole;
}

/**
 * The layout used to store Appsemble messages.
 */
export interface AppsembleMessages {
  /**
   * Messages related to the Appsemble core.
   *
   * This may be an empty object if the language is the default locale.
   */
  core: Record<string, string>;

  /**
   * Translations for global block messages and meta properties of the app.
   *
   * This may be an empty object if the language is the default locale.
   */
  app: Record<string, string>;

  /**
   * A list of messages specific to the app.
   */
  messageIds: Record<string, string>;

  /**
   * A list of messages specific to each block used in the app.
   *
   * At root the keys represent a block type.
   * One layer deep the keys represent a block version.
   * Two layers deep the keys represent the key/message pairs.
   *
   * @example
   * {
   *   "<at>example/test": {
   *     "0.0.0": {
   *       "exampleKey": "Example Message"
   *     }
   *   }
   * }
   */
  blocks: Record<string, Record<string, Record<string, string>>>;
}

// XXX: The interfaces for messages below kinda suck
/**
 * Translated messages for an app or block.
 */
export interface Messages {
  /**
   * If true, force update app messages.
   */
  force?: boolean;

  /**
   * The language represented by these messages.
   */
  language: string;

  /**
   * A mapping of message id to message content.
   */
  messages?: AppsembleMessages;
}

export interface AppMessages {
  /**
   * The language represented by these messages.
   */
  language: string;

  /**
   * The messages available to the app
   */
  messages: AppsembleMessages;
}

/**
 * A representation of an OAuth2 provider in Appsemble.
 *
 * This interface holds the properties needed to render a redirect button on the login or profile
 * screen.
 */
export interface OAuth2Provider {
  type?: 'oauth2';

  /**
   * The OAuth2 redirect URL.
   *
   * The user will be redirected here. On this page the user will have to grant access to Appsemble
   * to log them in.
   */
  authorizationUrl: string;

  /**
   * The public client id which identifies Appsemble to the authorization server.
   */
  clientId: string;

  /**
   * A Font Awesome icon which represents the OAuth2 provider.
   */
  icon: IconName;

  /**
   * A display name which represents the OAuth2 provider.
   *
   * I.e. `Facebook`, `GitLab`, or `Google`.
   */
  name: string;

  /**
   * The login scope that will be requested from the authorization server.
   *
   * This is represented as a space separated list of scopes.
   */
  scope: string;
}

export type ValueFromDefinition = boolean | number | string | null | undefined;

export type ValueFromProcess = boolean | number | string | undefined;

export interface AppConfigEntryDefinition {
  name: string;
  value: ValueFromDefinition;
}

export interface AppConfigEntry extends AppConfigEntryDefinition {
  /**
   * An autogenerated ID.
   */
  id: number;

  /**
   * The parsed value of the config entry.
   */
  value: ValueFromProcess;
}

export type ServiceAuthenticationMethod =
  | 'client-certificate'
  | 'client-credentials'
  | 'cookie'
  | 'custom-header'
  | 'http-basic'
  | 'query-parameter';

export interface AppServiceSecretDefinition {
  /**
   * An optional name to give extra clarity what the secret is used for.
   */
  name?: string;

  /**
   * The url pattern that is matched when a proxied request action is called.
   */
  urlPatterns: string;

  /**
   * The method to authenticate the request action with.
   */
  authenticationMethod: ServiceAuthenticationMethod;

  /**
   * The parameter name, header name, username or certificate that goes with the secret.
   */
  identifier?: string;

  /**
   * The secret to authenticate the proxied outgoing request with.
   */
  secret?: string;

  /**
   * The tokenUrl used for client-credentials method.
   */
  tokenUrl?: string;

  /**
   * The scope used for client-credentials method.
   */
  scope?: string;

  /**
   * The custom certificate authority used for client-certificate method.
   */
  ca?: string;

  /**
   * If a secret is marked public, it can be applied to the unauthenticated users, e.g. in the
   * requests originating in a custom sign up or login page.
   *
   * @default false
   */
  public: boolean;
}

export interface AppServiceSecret extends AppServiceSecretDefinition {
  /**
   * An autogenerated ID.
   */
  id: number;
}

export interface AppWebhookSecretDefinition {
  /**
   * The name of the webhook this secret is tied to.
   */
  webhookName: string;

  /**
   * An optional name to give extra clarity what the secret is used for.
   */
  name?: string;
}

export interface AppWebhookSecret extends AppWebhookSecretDefinition {
  /**
   * An autogenerated ID.
   */
  id: string;
}

export interface AppOAuth2Secret extends OAuth2Provider {
  /**
   * An autogenerated ID.
   */
  id?: number;

  /**
   * The OAuth2 client secret used to identify Appsemble as a client to the authorization server.
   */
  clientSecret: string;

  /**
   * The URL where tokens may be requested using the authorization code flow.
   */
  tokenUrl: string;

  /**
   * The URL from where to fetch user info.
   */
  userInfoUrl?: string;

  /**
   * The remapper to apply on the user info data.
   */
  remapper: Remapper;
}

export interface WritableAppSamlSecret {
  /**
   * The name that will be displayed on the login button.
   */
  name: string;

  /**
   * The icon that will be displayed on the login button.
   */
  icon: IconName;

  /**
   * The certificate of the identity provider.
   */
  idpCertificate: string;

  /**
   * The URL of the identity provider where SAML metadata is hosted.
   */
  entityId: string;

  /**
   * The URL of the identity provider where the user will be redirected to in order to login.
   */
  ssoUrl: string;

  /**
   * The custom SAML attribute that’s used to specify the user display name.
   */
  nameAttribute: string;

  /**
   * The custom SAML attribute that’s used to specify the user email address.
   */
  emailAttribute: string;
}

export interface AppSamlSecret extends WritableAppSamlSecret {
  /**
   * The unique ID of the secret.
   */
  id?: number;

  /**
   * When the secret was last updated.
   */
  updated?: string;

  /**
   * The SAML service provider certificate.
   */
  spCertificate?: string;
}

export type SAMLStatus =
  | 'badsignature'
  | 'emailconflict'
  | 'invalidrelaystate'
  | 'invalidsecret'
  | 'invalidstatuscode'
  | 'invalidsubjectconfirmation'
  | 'missingnameid'
  | 'missingsubject';

export interface ProjectConfig {
  /**
   * The name of the project.
   */
  name: string;

  /**
   * The description of the project.
   */
  description?: string;

  /**
   * The long description of the project.
   *
   * This is displayed when rendering documentation and supports Markdown.
   */
  longDescription?: string;

  /**
   * A [semver](https://semver.org) representation of the project version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;

  [key: string]: any;
}

export interface ProjectBuildConfig extends ProjectConfig {
  /**
   * The build output directory relative to the project directory.
   */
  output?: string;

  /**
   * The absolute directory of the project.
   */
  dir: string;
}

export interface ProjectImplementations {
  /**
   * The actions that are supported by a project.
   */
  actions?: Record<string, ActionType>;

  /**
   * The events that are supported by a project.
   */
  events?: {
    listen?: Record<string, EventType>;
    emit?: Record<string, EventType>;
  };

  /**
   * The messages that are supported by a project.
   */
  messages?: Record<string, Record<string, any> | never>;

  /**
   * A JSON schema to validate project parameters.
   */
  parameters?: Schema;
}

export interface ProjectManifest extends ProjectConfig, ProjectImplementations {
  /**
   * Array of urls associated to the files of the project.
   */
  files: string[];
}

export interface BlockManifest extends ProjectManifest {
  /**
   * The URL that can be used to fetch this block’s icon.
   */
  iconUrl?: string | null;

  /**
   * The languages that are supported by the block by default.
   *
   * If the block has no messages, this property is `null`.
   */
  languages: string[] | null;

  examples?: string[];

  /**
   * Whether the block should be listed publicly
   * for users who aren’t part of the block’s organization.
   *
   * - **`public`**: The block is visible for everyone.
   * - **`unlisted`**: The block will only be visible if the user is
   * logged in and is part of the block’s organization.
   */
  visibility?: 'public' | 'unlisted';

  /**
   * Whether action validation for wildcard action is skipped.
   */
  wildcardActions?: boolean;

  /**
   * The type of layout to be used for the block.
   */
  layout?: 'float' | 'grow' | 'hidden' | 'static' | null;
}

export interface CompanionContainerDefinition {
  /**
   * Alias of the container in the app.
   */
  name: string;

  /**
   * Image to use for the container.
   */
  image: string;

  /**
   * Port exposed by the provided image.
   *
   * E.g., if the Dockerfile of the image contains `EXPOSE 3000`
   * then `port` should be 3000 as well.
   */
  port: number;

  /**
   * Limits the resources used and required by companion containers
   *
   */
  resources?: ContainerResources;

  /**
   * Environment within the container
   */
  env?: ContainerEnvVar[];

  /**
   * Additional properties e.g., labels, annotations
   *
   */
  metadata?: Record<string, any>;
}

export interface ContainerResources {
  /**
   * Maximum amount of resources allowed
   */
  limits: ContainerResourceProps;
}
export interface ContainerResourceProps {
  cpu: string;
  memory: string;
}

export interface ContainerEnvVar {
  name: string;
  value: string;
  useValueFromSecret?: boolean;
}
export interface LogObject {
  fromAppsemble: boolean;
  entries: string[];
}
