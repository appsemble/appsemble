/**
 * These types are extracted into this package, so they can be imported in {@link @appsemble/types}
 * without causing type errors. Don’t import from this module directly. Instead, import from
 * {@link @appsemble/sdk}.
 */

/**
 * Common HTTP methods, but either all upper case or all lower case.
 */
export type HTTPMethods =
  | 'delete'
  | 'get'
  | 'patch'
  | 'post'
  | 'put'
  | 'DELETE'
  | 'GET'
  | 'PATCH'
  | 'POST'
  | 'PUT';

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

export type RequestLikeActionTypes =
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
  | BaseAction<'event'>
  | BaseAction<'flow.back'>
  | BaseAction<'flow.cancel'>
  | BaseAction<'flow.finish'>
  | BaseAction<'flow.next'>
  | BaseAction<'noop'>
  | BaseAction<'static'>
  | LinkAction
  | LogAction
  | RequestAction
  | ResourceGetAction
  | ResourceQueryAction
  | ResourceCreateAction
  | ResourceUpdateAction
  | ResourceDeleteAction
  | BaseAction<'resource.subscription.subscribe'>
  | BaseAction<'resource.subscription.unsubscribe'>
  | BaseAction<'resource.subscription.toggle'>
  | BaseAction<'resource.subscription.status'>
  | BaseAction<'message'>;

/**
 * A color known to Bulma.
 */
export type BulmaColor =
  | 'dark'
  | 'primary'
  | 'link'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'white';

export type BulmaSize = 'small' | 'normal' | 'medium' | 'large';

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
