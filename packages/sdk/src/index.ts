import { Promisable } from 'type-fest';

/*
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

export interface EventParams {
  emit?: string;
  listen?: string;
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
  | BaseAction<'flow.back'>
  | BaseAction<'flow.cancel'>
  | BaseAction<'flow.finish'>
  | BaseAction<'flow.next'>
  | BaseAction<'noop'>
  | BaseAction<'event'>
  | LinkAction
  | LogAction
  | RequestAction
  | ResourceGetAction
  | ResourceQueryAction
  | ResourceCreateAction
  | ResourceUpdateAction
  | ResourceDeleteAction
  | BaseAction<'resource.subscribe'>;

/**
 * A block that is displayed on a page.
 */
export interface Block<P = any, A = {}, E extends EventParams = Required<EventParams>> {
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
  theme?: Theme;

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

  /**
   * Mapping of the events the block can listen to and emit.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  events?: {
    listen: Record<E['listen'], string>;
    emit: Record<E['emit'], string>;
  };

  /**
   * A list of roles that are allowed to view this block.
   */
  roles?: string[];
}

/**
 * A color know to Bulma.
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

export type Actions<A> = { [K in keyof A]: Action };

export interface PageParameters {
  [parameter: string]: string;
}

export interface Utils {
  /**
   * Register a function that should be called when the block is being removed.
   *
   * Use this to clean up resouces that would otherwise stay in memory, e.g. object URLs.
   */
  addCleanup: (fn: () => void) => void;

  /**
   * Show a bulma style message.
   */
  showMessage: (message: string | Message) => void;
}

export type EventEmitters<E extends EventParams> = Record<
  E['emit'],
  (data: any, error?: string) => void
>;
export type EventListeners<E extends EventParams> = Record<
  E['listen'],
  (callback: (data: any, error?: string) => void) => void
>;

export interface Events<E extends EventParams = {}> {
  /**
   * Emit an Appsemble event.
   *
   * @param type The type of event to emit.
   * @param data Data to emit with the event.
   */
  emit: EventEmitters<E>;

  /**
   * Remove an event listener for an Appsemble event.
   *
   * @param type The type of event to listen remove the listener from.
   * @param callback The callback to remove.
   */
  off: EventListeners<E>;

  /**
   * Add an event listener for an Appsemble event.
   *
   * @param type The type of event to listen on.
   * @param callback A callback to register for the event.
   */
  on: EventListeners<E>;
}

/**
 * The parameters that get passed to the bootstrap function.
 */
export interface BootstrapParams<P = any, A = {}, E extends EventParams = {}> {
  /**
   * The actions that may be dispatched by the block.
   */
  actions: Actions<A>;

  /**
   * The block as it is defined in the app definition.
   */
  block: Block<P, A, E>;

  /**
   * Any kind of data that has been passed in by some context.
   */
  data: any;

  /**
   * Event related functions and constants.
   */
  events: Events<E>;

  /**
   * URL parameters of the current route.
   *
   * If the page on which the block is rendered, has parameters specified on a page level, the
   * parameter keys and values of the page will be extracted and set as this object.
   */
  pageParameters?: PageParameters;

  /**
   * The theme of the block given the context.
   *
   * This is based on a combination of the base theme, app theme, page theme and block theme.
   */
  theme: Theme;

  /**
   * The shadow root to which DOM elements may be appended.
   */
  shadowRoot: ShadowRoot;

  /**
   * Some utility functions provided by the Appsemble app framework.
   */
  utils: Utils;
}

/**
 * @private
 */
export type BootstrapFunction<P = any, A = {}, E extends EventParams = {}> = (
  params: BootstrapParams<P, A, E>,
) => Promisable<void>;

/**
 * @private
 */
export interface AppsembleBootstrapEvent extends CustomEvent {
  detail: {
    fn: BootstrapFunction;
    document: Document;
  };
}

/**
 * Register a boostrap function.
 *
 * @param fn The bootstrap function to register
 */
export function bootstrap<P = any, A = {}, E extends EventParams = {}>(
  fn: BootstrapFunction<P, A, E>,
): void {
  const event = new CustomEvent('AppsembleBootstrap', {
    detail: {
      fn,
      document,
    },
  }) as AppsembleBootstrapEvent;
  if (document.currentScript) {
    document.currentScript.dispatchEvent(event);
  }
}

/**
 * Attach the returned node to the shadow root.
 *
 * This convenience wrapper attaches nodes returned by the bootstrap function to the shadow root.
 * This means that the initialization function for a block simply has to return a node.
 *
 * @param fn The bootstrap function to register.
 */
export function attach<P = any, A = {}, E extends EventParams = {}>(
  fn: (params: BootstrapParams<P, A, E>) => Promisable<HTMLElement | void>,
): void {
  bootstrap<P, A, E>(
    async (params): Promise<void> => {
      const { shadowRoot } = params;

      const node = await fn(params);
      if (node instanceof HTMLElement) {
        shadowRoot.appendChild(node);
      }
    },
  );
}
