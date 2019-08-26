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

export interface Events {
  /**
   * Emit an Appsemble event.
   *
   * @param type The type of event to emit.
   * @param data Data to emit with the event.
   */
  emit: (type: string | symbol, data: any) => void;

  /**
   * Remove an event listener for an Appsemble event.
   *
   * @param type The type of event to listen remove the listener from.
   * @param callback The callback to remove.
   */
  off: (type: string | symbol, callback: (event: Event) => any) => void;

  /**
   * Add an event listener for an Appsemble event.
   *
   * @param type The type of event to listen on.
   * @param callback A callback to register for the event.
   */
  on: (type: string | symbol, callback: (event: Event) => any) => void;
}

/**
 * The parameters that get passed to the bootstrap function.
 */
export interface BootstrapParams<P = any, A = {}> {
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
export type BootstrapFunction<P = any, A = {}> = (
  params: BootstrapParams<P, A>,
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
export function bootstrap<P = any, A = {}>(fn: BootstrapFunction<P, A>): void {
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
export function attach<P = any, A = {}>(
  fn: (params: BootstrapParams<P, A>) => Promisable<HTMLElement | void>,
): void {
  bootstrap<P, A>(
    async (params): Promise<void> => {
      const { shadowRoot } = params;

      const node = await fn(params);
      if (node instanceof HTMLElement) {
        shadowRoot.appendChild(node);
      }
    },
  );
}
