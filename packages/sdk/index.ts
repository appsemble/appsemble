import { Block, HTTPMethods, Message, Theme } from '@appsemble/types';
import { Promisable } from 'type-fest';

export { Message, Theme };

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

export interface RequestAction<T extends string = 'request'> extends BaseAction<T> {
  /**
   * The HTTP method used to make the request.
   */
  method: HTTPMethods;
  /**
   * The URL to which the request will be made.
   */
  url: string;
}

export type ResourceGetAction = RequestAction<'resource.get'>;
export type ResourceQueryAction = RequestAction<'resource.query'>;
export type ResourceCreateAction = RequestAction<'resource.create'>;
export type ResourceUpdateAction = RequestAction<'resource.update'>;
export type ResourceDeleteAction = RequestAction<'resource.delete'>;

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
 * Register a boostrap function.
 *
 * @param fn The bootstrap function to register
 */
export function bootstrap<P = any, A = {}>(
  fn: (params: BootstrapParams<P, A>) => Promisable<void>,
): void {
  const event = new CustomEvent('AppsembleBootstrap', {
    detail: {
      fn,
      document,
    },
  });
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
