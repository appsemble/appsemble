import { IconName } from '@fortawesome/fontawesome-common-types';

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

  actions?: {
    type: string;
    required: boolean;
  };
}

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
   * The theme of the block.
   */
  theme: Theme;

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
  // XXX add type
  schema: any;
  url?: string;
}

export interface Resources {
  [name: string]: Resource;
}

export interface Page<A = {}> {
  name: string;
  icon: IconName;
  parameters: string[];
  theme: Theme;
  actions?: A;
}

export interface App {
  id?: number;
  organizationId?: string;
  navigation?: 'bottom';
  pages: Page<any>[];
  resources: Resources;
  theme: Theme;
}
