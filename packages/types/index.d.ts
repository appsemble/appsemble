import { IconName } from '@fortawesome/fontawesome-common-types';
import { OpenAPIV3 } from 'openapi-types';

/**
 * HTTP methods that support a request body.
 */
export type BodyHTTPMethodsUpper = 'PATCH' | 'POST' | 'PUT';

/**
 * HTTP methods that support a request body, but lower case.
 */
export type BodyHTTPMethodsLower = 'patch' | 'post' | 'put';

/**
 * HTTP methods that support a request body, but all upper case or all lower case..
 */
export type BodyHTTPMethods = BodyHTTPMethodsUpper | BodyHTTPMethodsLower;

/**
 * Common HTTP methods.
 */
export type HTTPMethodsUpper = 'DELETE' | 'GET' | BodyHTTPMethodsUpper;

/**
 * Common HTTP methods, but lower case.
 */
export type HTTPMethodsLower = 'delete' | 'get' | BodyHTTPMethodsLower;

/**
 * Common HTTP methods, but either all upper case or all lower case.
 */
export type HTTPMethods = HTTPMethodsUpper | HTTPMethodsLower;

/**
 * A color know to Bulma.
 */
export type BulmaColor = 'dark' | 'primary' | 'link' | 'info' | 'success' | 'warning' | 'danger';

export interface Theme {
  /**
   * The color primarily featured in the color scheme.
   */
  primaryColor: string;

  /**
   * The color used for links.
   */
  linkColor: string;

  /**
   * The color used to feature succesful or positive actions.
   */
  successColor: string;

  /**
   * The color used to indicate information.
   */
  infoColor: string;

  /**
   * The color used for elements that require extra attention.
   */
  warningColor: string;

  /**
   * The color used for elements that demand caution for destructive actions.
   */
  dangerColor: string;

  /**
   * The color used in the foreground of the splash screen.
   */
  themeColor: string;

  /**
   * The color used in the background of the splash screen.
   */
  splashColor: string;

  /**
   * The link to the tile layer used for Leaflet maps.
   */
  tileLayer: string;
}

export interface Message {
  /**
   * The content of the message to display.
   */
  body: string;

  /**
   * The color to use for the message.
   */
  color?: BulmaColor;

  /**
   * The timeout period for this message (in milliseconds).
   */
  timeout?: number;

  /**
   * Whether or not to show the dismiss button.
   */
  dismissable?: boolean;
}

/**
 * A block that is displayed on a page.
 */
export interface Block<P = any, A = {}> {
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
   * A free form mapping of named paramters.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  parameters?: P;

  /**
   * A mapping of actions that can be fired by the block to action handlers.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  actions?: A;
}

export interface ResourceCall {
  method: HTTPMethods;
  url: string;
}

export interface Resource {
  create: ResourceCall;
  delete: ResourceCall;
  get: ResourceCall;
  query: ResourceCall;
  update: ResourceCall;
  blobs?: {
    type?: 'upload';
    method?: 'POST' | 'PUT';
    url?: string;
    serialize?: 'custom';
  };
  id?: number;
  schema: OpenAPIV3.SchemaObject;
  url?: string;
}

export interface BaseAction<T extends string> {
  /**
   * The type of the action.
   */
  type: T;

  /**
   * A function which can be called to dispatch the action.
   */
  dispatch: (data?: any) => Promise<any>;
}

type RequestLikeActionTypes =
  | 'request'
  | 'resource.create'
  | 'resource.delete'
  | 'resource.get'
  | 'resource.query'
  | 'resource.update';

export interface LinkAction extends BaseAction<'link'> {
  /**
   * Get the link that the action would link to if the given data was passed.
   */
  href: (data?: any) => string;
}

export interface LogAction extends BaseAction<'log'> {
  /**
   * The logging level.
   */
  level: 'info' | 'warn' | 'error';
}

export interface RequestLikeAction<T extends RequestLikeActionTypes> extends BaseAction<T> {
  /**
   * The HTTP method used to make the request.
   */
  method: HTTPMethods;
  /**
   * The URL to which the request will be made.
   */
  url: string;
}

export type RequestAction = RequestLikeAction<'request'>;
export type ResourceCreateAction = RequestLikeAction<'resource.create'>;
export type ResourceDeleteAction = RequestLikeAction<'resource.delete'>;
export type ResourceGetAction = RequestLikeAction<'resource.get'>;
export type ResourceQueryAction = RequestLikeAction<'resource.query'>;
export type ResourceUpdateAction = RequestLikeAction<'resource.update'>;

/**
 * An action that can be called from within a block.
 */
export type Action =
  | BaseAction<'dialog'>
  | BaseAction<'dialog.error'>
  | BaseAction<'dialog.ok'>
  | BaseAction<'flow.back'>
  | BaseAction<'flow.cancel'>
  | BaseAction<'flow.finish'>
  | BaseAction<'flow.next'>
  | BaseAction<'noop'>
  | LinkAction
  | LogAction
  | RequestAction
  | ResourceGetAction
  | ResourceQueryAction
  | ResourceCreateAction
  | ResourceUpdateAction
  | ResourceDeleteAction;

export interface BlobUploadType {
  type?: 'upload';
  method?: BodyHTTPMethods;
  serialize?: 'custom';
  url?: string;
}

interface BaseActionDefinition<T extends Action['type']> {
  type: T;
  remap: string;
}

interface DialogActionDefinition extends BaseActionDefinition<'dialog'> {
  fullscreen?: boolean;
  blocks: Block[];
}

interface LinkActionDefinition extends BaseActionDefinition<'link'> {
  to: string;
  parameters?: Record<string, any>;
}

interface LogActionDefinition extends BaseActionDefinition<'log'> {
  level: LogAction['level'];
}

interface RequestLikeActionDefinition<T extends RequestLikeActionTypes = RequestLikeActionTypes>
  extends BaseActionDefinition<T> {
  blobs: BlobUploadType;
  method: HTTPMethods;
  schema: OpenAPIV3.SchemaObject;
  query: Record<string, string>;
  url: string;
  serialize: string;
  onSuccess?: ActionDefinition;
  onError?: ActionDefinition;
}

interface ResourceActionDefinition<T extends RequestLikeActionTypes>
  extends RequestLikeActionDefinition<T> {
  resource: string;
}

type RequestActionDefinition = RequestLikeActionDefinition<'request'>;
type ResourceCreateActionDefinition = ResourceActionDefinition<'resource.create'>;
type ResourceDeleteActionDefinition = ResourceActionDefinition<'resource.delete'>;
type ResourceGetActionDefinition = ResourceActionDefinition<'resource.get'>;
type ResourceQueryActionDefinition = ResourceActionDefinition<'resource.query'>;
type ResourceUpdateActionDefinition = ResourceActionDefinition<'resource.update'>;

export type ActionDefinition =
  | BaseActionDefinition<'flow.back'>
  | BaseActionDefinition<'flow.cancel'>
  | BaseActionDefinition<'flow.finish'>
  | BaseActionDefinition<'flow.next'>
  | BaseActionDefinition<'noop'>
  | DialogActionDefinition
  | LinkActionDefinition
  | LogActionDefinition
  | RequestActionDefinition
  | ResourceCreateActionDefinition
  | ResourceDeleteActionDefinition
  | ResourceGetActionDefinition
  | ResourceQueryActionDefinition
  | ResourceUpdateActionDefinition

  // This shouldn’t be here, but TypeScript won’t shut up without it.
  | RequestLikeActionDefinition;

export interface BlockDefinition {
  /**
   * A definition for a block.
   * pattern: ^@[a-z]([a-z\d-]{0,30}[a-z\d])?\/[a-z]([a-z\d-]{0,30}[a-z\d])$
   * The name of a block.
   */
  name: string;

  /**
   * A [semver](https://semver.org) representation of the block version.
   *
   * Pattern:
   * ^\d+\.\d+\.\d+$
   */
  version: string;

  /*
   * A human readable description of the block.
   */
  description: string;

  /**
   * The type of layout to be used for the block.
   */
  layout: 'float' | 'static' | 'grow';

  /**
   * Array of urls associated to the files of the block.
   */
  files: string[];

  actions?: Record<string, { required?: boolean }>;
}

export interface Resources {
  [name: string]: Resource;
}

export interface Page {
  name: string;
  icon: IconName;
  parameters: string[];
  actions?: Record<string, ActionDefinition>;
}

export interface App {
  id: number;
  navigation?: 'bottom';
  pages: Page[];
  resources: Resources;
}
