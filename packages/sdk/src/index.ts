import type { Promisable } from 'type-fest';

/**
 * Actions defined on a block.
 *
 * If a block uses actions, extend this interface using module augmentation. The keys are the names
 * of the events the block supports.
 *
 * @example
 * declare module '<at>appsemble/sdk' {
 *   interface Actions {
 *     onClick: {}
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Actions {}

/**
 * Event emitters defined on a block.
 *
 * If a block emits events, extend this interface using module augmentation. The keys are the names
 * of the events the block can emit.
 *
 * @example
 * declare module '<at>appsemble/sdk' {
 *   interface EventEmitters {
 *     data: {}
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventEmitters {}

/**
 * Event listeners defined on a block.
 *
 * If a block listens on events, extend this interface using module augmentation. The keys are the
 * names of the events the block can emit.
 *
 * @example
 * declare module '<at>appsemble/sdk' {
 *   interface EventListeners {
 *     data: {}
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventListeners {}

/**
 * Custom free form parameters defined on a block.
 *
 * If a block listens on events, extend this interface using module augmentation. The keys are the
 * names of the events the block can emit.
 *
 * @example
 * declare module '<at>appsemble/sdk' {
 *   interface Parameters {
 *     param1: string;
 *     param2: number;
 *     param3: {
 *       nested: boolean;
 *     }
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Parameters {}

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
  | BaseAction<'resource.subscription.subscribe'>
  | BaseAction<'resource.subscription.unsubscribe'>
  | BaseAction<'resource.subscription.toggle'>
  | BaseAction<'resource.subscription.status'>;

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

  /**
   * Get a URL serving an asset for the given asset id.
   *
   * @param assetId The id of the asset whose URL to get.
   * @returns The URL that matches the given asset id.
   */
  asset: (assetId: number | string) => string;
}

export interface Events {
  /**
   * Emit an Appsemble event.
   *
   * @param type The type of event to emit.
   * @param data Data to emit with the event.
   */
  emit: { [K in keyof EventEmitters]: (data: any, error?: string) => void };

  /**
   * Remove an event listener for an Appsemble event.
   *
   * @param type The type of event to listen remove the listener from.
   * @param callback The callback to remove.
   * @returns Boolean indicating whether a listener is implemented or not.
   */
  off: { [K in keyof EventListeners]: (callback: (data: any, error?: string) => void) => boolean };

  /**
   * Add an event listener for an Appsemble event.
   *
   * @param type The type of event to listen on.
   * @param callback A callback to register for the event.
   * @returns Boolean indicating whether a listener is implemented or not.
   */
  on: { [K in keyof EventListeners]: (callback: (data: any, error?: string) => void) => boolean };
}

/**
 * The parameters that get passed to the bootstrap function.
 */
export interface BootstrapParams {
  /**
   * The actions that may be dispatched by the block.
   */
  actions: { [K in keyof Actions]: Action };

  /**
   * The parameters as they are defined in the app definition.
   */
  parameters: Parameters;

  /**
   * Any kind of data that has been passed in by some context.
   */
  data: any;

  /**
   * Event related functions and constants.
   */
  events: Events;

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
export type BootstrapFunction = (params: BootstrapParams) => Promisable<void>;

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
export function bootstrap(fn: BootstrapFunction): void {
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
export function attach(fn: (params: BootstrapParams) => Promisable<HTMLElement | void>): void {
  bootstrap(
    async (params): Promise<void> => {
      const { shadowRoot } = params;

      const node = await fn(params);
      if (node instanceof HTMLElement) {
        shadowRoot.appendChild(node);
      }
    },
  );
}
