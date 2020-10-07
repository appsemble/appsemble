import type {
  Action,
  BaseMessage,
  HTTPMethods,
  LogAction,
  RequestLikeActionTypes,
  Theme,
} from '@appsemble/sdk/src/types';
import type { IconName } from '@fortawesome/fontawesome-common-types';
import type { OpenAPIV3 } from 'openapi-types';
import type { JsonObject, RequireExactlyOne } from 'type-fest';
import type { Definition } from 'typescript-json-schema';

export type { Theme };

/**
 * A block that is displayed on a page.
 */
export interface BlockDefinition {
  /**
   * The type of the block.
   *
   * A block type follow the format `@organization/name`.
   * If the organization is _appsemble_, it may be omitted.
   *
   * Pattern:
   * ^(@[a-z]([a-z\d-]{0,30}[a-z\d])?\/)?[a-z]([a-z\d-]{0,30}[a-z\d])$
   *
   * Examples:
   * - `form`
   * - `@amsterdam/splash`
   */
  type: string;

  /**
   * A [semver](https://semver.org) representation of the block version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;

  /**
   * An optional header to render above the block.
   */
  header?: string;

  /**
   * The theme of the block.
   */
  theme?: Partial<Theme>;

  /**
   * A free form mapping of named paramters.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  parameters?: JsonObject;

  /**
   * A mapping of actions that can be fired by the block to action handlers.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  actions?: { [action: string]: ActionDefinition };

  /**
   * Mapping of the events the block can listen to and emit.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  events?: {
    listen?: { [listener: string]: string };
    emit?: { [emitter: string]: string };
  };

  /**
   * A list of roles that are allowed to view this block.
   */
  roles?: string[];
}

/**
 * OpenID Connect specifies a set of standard claims about the end-user, which cover common profile
 * information such as name, contact details, date of birth and locale.
 *
 * The Connect2id server can be set up to provide additional custom claims, such as roles and
 * permissions.
 */
export interface UserInfo {
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
  // eslint-disable-next-line camelcase
  email_verified: boolean;

  /**
   * The URL of the profile picture for the end-user.
   */
  picture?: string;

  /**
   * A URL that links to the user profile.
   */
  profile?: string;
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
  // eslint-disable-next-line camelcase
  access_token: string;

  /**
   * How long until the access token expires in seconds from now.
   */
  // eslint-disable-next-line camelcase
  expires_in?: number;

  /**
   * The OpenID ID token as a JWT.
   *
   * This field is only present on OpenID connect providers.
   */
  // eslint-disable-next-line camelcase
  id_token?: string;

  /**
   * A refresh token for getting a new access token.
   */
  // eslint-disable-next-line camelcase
  refresh_token?: string;

  // eslint-disable-next-line camelcase
  token_type: 'bearer';
}

export interface Remappers {
  /**
   * Get a property from the context.
   */
  context: string;

  /**
   * Convert a string to a date using a given format.
   */
  'date.parse': string;

  /**
   * Compare all computed remapper values against each other.
   *
   * Returns `true` if all entries are equal, otherwise `false`.
   */
  equals: Remapper[];

  /**
   * Builds an array based on the given data and remappers.
   *
   * The remappers gets applied to each item in the array.
   *
   * Always returns an array, can be empty if supplied data isn’t an array.
   */
  'array.map': Remapper;

  /**
   * Checks if condition results in a truthy value.
   *
   * Returns value of then if condition is truthy, otherwise it returns the value of else.
   */
  if: { condition: Remapper; then: Remapper; else: Remapper };

  /**
   * Get the current array.map’s index or length.
   *
   * Returns nothing if array.map’s context isn’t set.
   */
  array: 'index' | 'length';

  /**
   * Create a new object given some predefined mapper keys.
   */
  'object.from': {
    [key: string]: Remapper;
  };

  /**
   * Use a static value.
   */
  static: any;

  /**
   * Get a property from an object.
   */
  prop: string;

  /**
   * Get the input data as it was initially passed to the remap function.
   */
  root: unknown;

  /**
   * Convert an input to lower or upper case.
   */
  'string.case': 'lower' | 'upper';

  /**
   * Format a string using remapped input variables.
   */
  'string.format': {
    /**
     * The message id pointing to the template string to format.
     */
    messageId?: string;

    /**
     * The template default string to format.
     */
    template?: string;

    /**
     * A set of remappers to convert the input to usable values.
     */
    values: {
      [key: string]: Remapper;
    };
  };

  /**
   * Match the content with the regex in the key, and replace it with its value.
   */
  'string.replace': {
    [regex: string]: string;
  };

  user: keyof UserInfo;
}

export type Remapper =
  | RequireExactlyOne<Remappers>[]
  | RequireExactlyOne<Remappers>
  | string
  | number
  | boolean;

export interface SubscriptionResponseResource {
  create: boolean;
  update: boolean;
  delete: boolean;
  subscriptions?: {
    [id: string]: {
      update: boolean;
      delete: boolean;
    };
  };
}

export interface SubscriptionResponse {
  [type: string]: SubscriptionResponseResource;
}

export interface Security {
  login?: 'password';
  default: {
    role: string;
    policy?: 'everyone' | 'organization' | 'invite';
  };
  roles: {
    [role: string]: {
      description?: string;
      inherits?: string[];
      defaultPage?: string;
    };
  };
}

export type Navigation = 'bottom' | 'left-menu' | 'hidden';
export type Login = 'navigation' | 'menu' | 'hidden';

export interface NotificationDefinition {
  to?: string[];
  subscribe?: 'all' | 'single' | 'both';
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
  query?: { [key: string]: string };

  /**
   * THe roles that are allowed to perform this action.
   */
  roles?: string[];
}

interface ResourceReferenceAction {
  trigger: ('create' | 'update' | 'delete')[];
}

interface ResourceReference {
  /**
   * The name of the referenced resource.
   */
  resource: string;

  create?: ResourceReferenceAction;
  update?: ResourceReferenceAction;
  delete?: ResourceReferenceAction;
}

export interface ResourceDefinition {
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
   * The definition for the `resource.update` action.
   */
  update?: ResourceCall;

  /**
   * How to upload blobs.
   */
  blobs?: BlobUploadType;

  /**
   * The property to use as the id.
   *
   * @default `id`
   */
  id?: number;

  /**
   * The JSON schema to validate resources against before sending it to the backend.
   */
  schema?: OpenAPIV3.SchemaObject;

  /**
   * The URL to post the resource to.
   *
   * @default autogenerated for use with the Appsemble resource API.
   */
  url?: string;

  /**
   * The references this resources has to other resources.
   */
  references?: { [property: string]: ResourceReference };

  /**
   * A time string representing when a resource should expire.
   *
   * Example: 1d 8h 30m
   */
  expires?: string;
}

export interface BlobUploadType {
  type?: 'upload';
  method?: HTTPMethods;
  serialize?: 'custom';
  url?: string;
}

export interface BaseActionDefinition<T extends Action['type']> {
  /**
   * The element to use as the base when returning the response data.
   */
  base?: string;

  /**
   * The type of the action.
   */
  type: T;

  /**
   * A remapper function. This may be used to remap data before it is passed into the action
   * function.
   */
  remap?: Remapper;

  /**
   * Another action that is dispatched when the action has been dispatched successfully.
   */
  onSuccess?: ActionDefinition;

  /**
   * Another action that is dispatched when the action has failed to dispatch successfully.
   */
  onError?: ActionDefinition;
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
  title?: string;
}

export interface EmailActionDefinition extends BaseActionDefinition<'email'> {
  /**
   * The recipient of the email.
   */
  to?: Remapper;

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
   * The attachments that should be attached to the email
   *
   * Should result in an array of URLs or asset IDs.
   */
  attachments?: Remapper;
}

export interface LinkActionDefinition extends BaseActionDefinition<'link'> {
  /**
   * Where to link to.
   *
   * This should be a page name.
   */
  to: string;

  /**
   * Parameters to use for formatting the link.
   */
  parameters?: { [key: string]: any };
}

export interface LogActionDefinition extends BaseActionDefinition<'log'> {
  /**
   * The logging level on which to log.
   *
   * @default `info`.
   */
  level?: LogAction['level'];
}

export interface RequestLikeActionDefinition<
  T extends RequestLikeActionTypes = RequestLikeActionTypes
> extends BaseActionDefinition<T> {
  /**
   * The element to use as the base when returning the response data.
   */
  base?: string;

  /**
   * Specify how to handle blobs in the object to upload.
   */
  blobs?: BlobUploadType;

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
  query?: { [key: string]: string };

  /**
   * The URL to which to make the request.
   */
  url?: string;

  /**
   * How to serialize the request body.
   */
  serialize?: 'formdata';
}

export interface ResourceActionDefinition<T extends RequestLikeActionTypes>
  extends RequestLikeActionDefinition<T> {
  /**
   * The name of the resource.
   */
  resource: string;
}

export type RequestActionDefinition = RequestLikeActionDefinition<'request'>;
export type ResourceCreateActionDefinition = ResourceActionDefinition<'resource.create'>;
export type ResourceDeleteActionDefinition = ResourceActionDefinition<'resource.delete'>;
export type ResourceGetActionDefinition = ResourceActionDefinition<'resource.get'>;
export type ResourceQueryActionDefinition = ResourceActionDefinition<'resource.query'>;
export type ResourceUpdateActionDefinition = ResourceActionDefinition<'resource.update'>;

export interface BaseResourceSubscribeActionDefinition<T extends Action['type']>
  extends BaseActionDefinition<T> {
  /**
   * The name of the resource.
   */
  resource: string;

  /**
   * The action to subscribe to. Defaults to `update` if not specified.
   */
  action?: 'create' | 'update' | 'delete';
}

export type ResourceSubscribeActionDefinition = BaseResourceSubscribeActionDefinition<
  'resource.subscription.subscribe'
>;

export type ResourceUnsubscribeActionDefinition = BaseResourceSubscribeActionDefinition<
  'resource.subscription.unsubscribe'
>;

export type ResourceSubscriptionToggleActionDefinition = BaseResourceSubscribeActionDefinition<
  'resource.subscription.toggle'
>;

export type ResourceSubscriptionStatusActionDefinition = Omit<
  BaseResourceSubscribeActionDefinition<'resource.subscription.status'>,
  'action'
>;

export interface EventActionDefinition extends BaseActionDefinition<'event'> {
  /**
   * The name of the event to emit to.
   */
  event: string;
}

export interface StaticActionDefinition extends BaseActionDefinition<'static'> {
  /**
   * The value to return.
   */
  value: any;
}

export type MessageActionDefinition = BaseActionDefinition<'message'> &
  BaseMessage & {
    /**
     * The content of the message to display.
     */
    body: Remapper;
  };

export type ActionDefinition =
  | BaseActionDefinition<'flow.back'>
  | BaseActionDefinition<'flow.cancel'>
  | BaseActionDefinition<'flow.finish'>
  | BaseActionDefinition<'flow.next'>
  | BaseActionDefinition<'email'>
  | BaseActionDefinition<'noop'>
  | DialogActionDefinition
  | EventActionDefinition
  | LinkActionDefinition
  | LogActionDefinition
  | RequestActionDefinition
  | ResourceCreateActionDefinition
  | ResourceDeleteActionDefinition
  | ResourceGetActionDefinition
  | ResourceQueryActionDefinition
  | ResourceUpdateActionDefinition
  | ResourceSubscribeActionDefinition
  | ResourceUnsubscribeActionDefinition
  | ResourceSubscriptionToggleActionDefinition
  | ResourceSubscriptionStatusActionDefinition
  | StaticActionDefinition
  | MessageActionDefinition

  // XXX This shouldn’t be here, but TypeScript won’t shut up without it.
  | RequestLikeActionDefinition;

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

export interface BlockManifest {
  /**
   * A block manifest as it is available to the app and in the SDK.
   * pattern: ^@[a-z]([a-z\d-]{0,30}[a-z\d])?\/[a-z]([a-z\d-]{0,30}[a-z\d])$
   * The name of a block.
   */
  name: string;

  /**
   * The description of the block.
   */
  description?: string;

  /**
   * The long description of the block.
   *
   * This is displayed when rendering block documentation and supports Markdown.
   */
  longDescription?: string;

  /**
   * A [semver](https://semver.org) representation of the block version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;

  /**
   * The type of layout to be used for the block.
   */
  layout?: 'float' | 'static' | 'grow' | 'hidden' | null;

  /**
   * Array of urls associated to the files of the block.
   */
  files: string[];

  /**
   * The actions that are supported by a block.
   */
  actions?: { [key: string]: ActionType };

  /**
   * The events that are supported by a block.
   */
  events?: {
    listen?: { [key: string]: EventType };
    emit?: { [key: string]: EventType };
  };

  /**
   * A JSON schema to validate block parameters.
   */
  parameters?: Definition;

  /**
   * @deprecated
   */
  resources?: null;
}

/**
 * This describes what a page will look like in the app.
 */
export interface BasePageDefinition {
  /**
   * The name of the page.
   *
   * This will be displayed on the top of the page and in the side menu.
   */
  name: string;

  /**
   * A list of roles that may view the page.
   */
  roles?: string[];

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
   * The navigation type to use.
   *
   * If this is omitted, a collapsable side navigation menu will be rendered on the left.
   */
  navigation?: Navigation;

  /**
   * Whether or not the page should be displayed in navigational menus.
   */
  hideFromMenu?: boolean;
}

interface SubPage {
  name: string;
  blocks: BlockDefinition[];
}

export interface BasicPageDefinition extends BasePageDefinition {
  type?: 'page';
  blocks: BlockDefinition[];
}

export interface FlowPageDefinition extends BasePageDefinition {
  type: 'flow';
  subPages: SubPage[];

  /**
   * A mapping of actions that can be fired by the page to action handlers.
   */
  actions?: {
    'flow.back'?: ActionDefinition;
    'flow.cancel'?: ActionDefinition;
    'flow.finish'?: ActionDefinition;
    'flow.next'?: ActionDefinition;
  };
}

export interface TabsPageDefinition extends BasePageDefinition {
  type: 'tabs';
  subPages: SubPage[];
}

export type PageDefinition = BasicPageDefinition | FlowPageDefinition | TabsPageDefinition;

export interface AppDefinition {
  /**
   * The name of the app.
   *
   * This determines the default path of the app.
   */
  name?: string;

  /**
   * The description of the app.
   */
  description?: string;

  /**
   * The default language of the app.
   *
   * @default 'en-US'
   */
  defaultLanguage?: string;

  /**
   * The security definition of the app.
   *
   * This determines user roles and login behavior.
   */
  security?: Security;

  /**
   * A list of roles that are required to view pages. Specific page roles override this property.
   */
  roles?: string[];

  /**
   * The default page of the app.
   */
  defaultPage: string;

  /**
   * The navigation type to use.
   *
   * If this is omitted, a collapsable side navigation menu will be rendered on the left.
   */
  navigation?: Navigation;

  /**
   * The location of the login and logout button.
   *
   * If this is omitted, it will be shown in the navbar.
   */
  login?: Login;

  /**
   * The strategy to use for apps to subscribe to push notifications.
   *
   * If this is omitted, push notifications can not be sent.
   */
  notifications?: 'opt-in' | 'startup';

  /**
   * The pages of the app.
   */
  pages: PageDefinition[];

  /**
   * Resource definitions that may be used by the app.
   */
  resources?: { [key: string]: ResourceDefinition };

  /**
   * The global theme for the app.
   */
  theme?: Partial<Theme>;
}

export interface App {
  /**
   * The unique identifier for the app.
   *
   * This value will be generated automatically by the API.
   */
  id?: number;

  /*
   * A domain name on which this app should be served.
   */
  domain?: string;

  /**
   * The id of the organization to which this app belongs.
   */
  OrganizationId?: string;

  path: string;
  private: boolean;

  definition: AppDefinition;

  /**
   * The app definition formatted as YAML.
   */
  yaml: string;

  /**
   * An app rating.
   */
  rating?: {
    /**
     * The number of people who rated the app.
     */
    count: number;

    /**
     * THe average app rating.
     */
    average: number;
  };

  /**
   * Whether the app has clonable resources.
   */
  resources?: boolean;

  /**
   * A list of URLs to app screenshots
   */
  screenshotUrls?: string[];

  /**
   * An app icon url
   */
  iconUrl?: string;

  $created?: string;

  $updated?: string;
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
}

/**
 * An invite for an organizaton.
 */
export interface OrganizationInvite {
  /**
   * The email address of the user to invite.
   */
  email: string;
}

/**
 * A member of an app.
 */
export interface AppMember {
  id: number;
  name: string;
  primaryEmail: string;
  role: string;
}

/**
 * Translated messages for an app.
 */
export interface AppMessages {
  /**
   * The language represented by these messages.
   */
  language: string;

  /**
   * A mapping of message id to message content.
   */
  messages: { [messageId: string]: string };
}

/**
 * A representation of an OAuth2 provider in Appsemble.
 *
 * This interface holds the properties needed to render a redirect button on the login or profile
 * screen.
 */
export interface OAuth2Provider {
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
