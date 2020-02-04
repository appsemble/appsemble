import {
  Action,
  BaseAction,
  Block,
  LinkAction,
  LogAction,
  Message,
  RequestAction,
  ResourceCreateAction,
  ResourceDeleteAction,
  ResourceGetAction,
  ResourceQueryAction,
  ResourceUpdateAction,
  Theme,
} from '@appsemble/types';
import { Promisable } from 'type-fest';

export {
  Action,
  BaseAction,
  LinkAction,
  LogAction,
  Message,
  RequestAction,
  ResourceCreateAction,
  ResourceDeleteAction,
  ResourceGetAction,
  ResourceQueryAction,
  ResourceUpdateAction,
  Theme,
};

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

export type EventEmitters<E extends EventParams> = Record<E['emit'], (data: any) => void>;
export type EventListeners<E extends EventParams> = Record<
  E['listen'],
  (callback: (data: any) => void) => void
>;
export interface EventParams {
  emit?: string;
  listen?: string;
}

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
  block: Block<P, A>;

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
