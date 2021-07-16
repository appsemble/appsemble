/**
 * These types are extracted into this package, so they can be imported in {@link @appsemble/types}
 * without causing type errors. Don’t import from this module directly. Instead, import from
 * {@link @appsemble/sdk}.
 */

/**
 * A user defined remapper function.
 *
 * @format remapper
 */
export type Remapper = object[] | boolean | number | object | string;

/**
 * Common HTTP methods, but either all upper case or all lower case.
 */
export type HTTPMethods =
  | 'DELETE'
  | 'delete'
  | 'GET'
  | 'get'
  | 'PATCH'
  | 'patch'
  | 'POST'
  | 'post'
  | 'PUT'
  | 'put';

export interface BaseAction<T extends string> {
  /**
   * A function which can be called to dispatch the action.
   */
  <R>(data?: any, context?: Record<string, any>): Promise<R>;

  /**
   * The type of the action.
   */
  type: T;
}

export interface LinkAction extends BaseAction<'link'> {
  /**
   * Get the link that the action would link to if the given data was passed.
   */
  href: (data?: unknown) => string;
}

export interface LogAction extends BaseAction<'log'> {
  /**
   * The logging level.
   */
  level: 'error' | 'info' | 'warn';
}

interface RequestLikeAction<T extends Action['type']> extends BaseAction<T> {
  /**
   * The HTTP method used to make the request.
   */
  method: HTTPMethods;
  /**
   * The URL to which the request will be made.
   */
  url: Remapper;
}

export type RequestAction = RequestLikeAction<'request'>;
export type ResourceCreateAction = RequestLikeAction<'resource.create'>;
export type ResourceDeleteAction = RequestLikeAction<'resource.delete'>;
export type ResourceGetAction = RequestLikeAction<'resource.get'>;
export type ResourceQueryAction = RequestLikeAction<'resource.query'>;
export type ResourceCountAction = RequestLikeAction<'resource.count'>;
export type ResourceUpdateAction = RequestLikeAction<'resource.update'>;

/**
 * An action that can be called from within a block.
 */
export type Action =
  | BaseAction<'condition'>
  | BaseAction<'dialog.error'>
  | BaseAction<'dialog.ok'>
  | BaseAction<'dialog'>
  | BaseAction<'email'>
  | BaseAction<'event'>
  | BaseAction<'flow.back'>
  | BaseAction<'flow.cancel'>
  | BaseAction<'flow.finish'>
  | BaseAction<'flow.next'>
  | BaseAction<'flow.to'>
  | BaseAction<'link.back'>
  | BaseAction<'link.next'>
  | BaseAction<'message'>
  | BaseAction<'noop'>
  | BaseAction<'resource.subscription.status'>
  | BaseAction<'resource.subscription.subscribe'>
  | BaseAction<'resource.subscription.toggle'>
  | BaseAction<'resource.subscription.unsubscribe'>
  | BaseAction<'share'>
  | BaseAction<'static'>
  | BaseAction<'team.join'>
  | BaseAction<'team.list'>
  | BaseAction<'throw'>
  | LinkAction
  | LogAction
  | RequestAction
  | ResourceCountAction
  | ResourceCreateAction
  | ResourceDeleteAction
  | ResourceGetAction
  | ResourceQueryAction
  | ResourceUpdateAction;

/**
 * A color known to Bulma.
 */
export type BulmaColor =
  | 'danger'
  | 'dark'
  | 'info'
  | 'link'
  | 'primary'
  | 'success'
  | 'warning'
  | 'white';

export type BulmaSize = 'large' | 'medium' | 'normal' | 'small';

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
}

export interface Message extends BaseMessage {
  /**
   * The content of the message to display.
   */
  body: string;
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
