import type { Promisable } from 'type-fest';

import type { Action, Message, Theme } from './types';

// eslint-disable-next-line no-duplicate-imports
export * from './types';

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

/**
 * A user defined remapper function.
 *
 * @format remapper
 */
export type Remapper = string | object[];

export interface PageParameters {
  [parameter: string]: string;
}

/**
 * A set of utility functions provided by the Appsemble SDK.
 */
export interface Utils {
  /**
   * Register a function that should be called when the block is being removed.
   *
   * Use this to clean up resouces that would otherwise stay in memory, e.g. object URLs.
   */
  addCleanup: (fn: () => void) => void;

  /**
   * Remap data based in a user defined remapper function.
   *
   * @param remapper - The user defined remapper function.
   * @param data - The data to remap.
   * @param context - The context to retrieve contextual data from.
   * @returns The result of the remapped data.
   */
  remap: (remapper: Remapper, data: any, context?: { [key: string]: any }) => any;

  /**
   * Show a bulma style message.
   */
  showMessage: (message: string | Message) => void;

  /**
   * Get a URL serving an asset for the given asset id.
   *
   * @param assetId - The id of the asset whose URL to get.
   * @returns The URL that matches the given asset id.
   */
  asset: (assetId: number | string) => string;
}

export interface Events {
  /**
   * Emit an Appsemble event.
   *
   * @param type - The type of event to emit.
   * @param data - Data to emit with the event.
   */
  emit: { [K in keyof EventEmitters]: (data: any, error?: string) => void };

  /**
   * Remove an event listener for an Appsemble event.
   *
   * @param type - The type of event to listen remove the listener from.
   * @param callback - The callback to remove.
   * @returns Boolean indicating whether a listener is implemented or not.
   */
  off: { [K in keyof EventListeners]: (callback: (data: any, error?: string) => void) => boolean };

  /**
   * Add an event listener for an Appsemble event.
   *
   * @param type - The type of event to listen on.
   * @param callback - A callback to register for the event.
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

export type BootstrapFunction = (params: BootstrapParams) => Promisable<void>;

export interface AppsembleBootstrapEvent extends CustomEvent {
  detail: {
    fn: BootstrapFunction;
    document: Document;
  };
}

/**
 * Register a boostrap function.
 *
 * @param fn - The bootstrap function to register
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
 * @param fn - The bootstrap function to register.
 */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export function attach(fn: (params: BootstrapParams) => Promisable<HTMLElement | void>): void {
  bootstrap(
    async (params): Promise<void> => {
      const { shadowRoot } = params;

      const node = await fn(params);
      if (node instanceof HTMLElement) {
        shadowRoot.append(node);
      }
    },
  );
}
