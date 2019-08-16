import { Theme } from '@appsemble/types';
import { Promisable } from 'type-fest';

interface BaseAction {
  /**
   * A function which can be called to dispatch the action.
   */
  dispatch: (data?: any) => Promise<any>;
}

/**
 * An action that can be called from within a block.
 */
export interface SimpleAction extends BaseAction {
  /**
   * The type of the action.
   */
  type:
    | 'dialog'
    | 'dialog.error'
    | 'dialog.ok'
    | 'log'
    | 'noop'
    | 'request'
    | 'resource.get'
    | 'resource.query'
    | 'resource.create'
    | 'resource.update'
    | 'resource.delete';
}

export interface LinkAction extends BaseAction {
  type: 'link';

  /**
   * Get the link that the action would link to if the given data was passed.
   */
  href: (data?: any) => string;
}

/**
 * An action that can be called from within a block.
 */
export type Action = SimpleAction | LinkAction;

export type Actions<A> = { [K in keyof A]: Action };

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

export interface Message {
  /**
   * The content of the message to display.
   */
  body: string;

  /**
   * The color to use for the message.
   */
  color?: 'primary' | 'info' | 'success' | 'warning' | 'danger';

  /**
   * The timeout period for this message (in milliseconds).
   */
  timeout?: number;

  /**
   * Whether or not to show the dismiss button.
   */
  dismissable?: boolean;
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
