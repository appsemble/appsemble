/**
 * An action that can be called from within a block.
 */
export interface Action {
  /** A function which can be called to dispatch the action. */
  dispatch: Function;

  /** The type of the action. */
  type: string;
}

/**
 * A block that is displayed on a page.
 */
export interface Block {
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
  parameters?: {};

  /**
   * A mapping of actions that can be fired by the block to action handlers.
   *
   * The exact meaning of the parameters depends on the block type.
   */
  actions?: {
    [action: string]: {
      type: string;
      [additionalProperty: string]: any;
    };
  };
}

export interface Message {
  /**
   * The content of the message to display.
   */
  body: string;
}

export interface PageParameters {
  [parameter: string]: string;
}

export interface Utils {
  /**
   * Show a bulma style message.
   */
  showMessage: (message: Message) => void;
}

/**
 * The parameters that get passed to the bootstrap function.
 */
export interface BootstrapParams {
  /**
   * The actions that may be dispatched by the block.
   */
  actions: { [key: string]: Action };

  /**
   * The block as it is defined in the app definition.
   */
  block: Block;

  /**
   * Any kind of data that has been passed in by some context.
   */
  data: {};

  /**
   * URL parameters of the current route.
   *
   * If the page on which the block is rendered, has parameters specified on a page level, the
   * parameter keys and values of the page will be extracted and set as this object.
   */
  pageParameters?: PageParameters;

  /**
   * The shadow root to which DOM elements may be appended.
   */
  shadowRoot: ShadowRoot;

  /**
   * Some utility functions provided by the Appsemble app framework.
   */
  utils: Utils;
}

type Awaitable<T> = T | Promise<T>;

/**
 * Register a boostrap function.
 *
 * @param fn The bootstrap function to register
 */
export function bootstrap(fn: (params: BootstrapParams) => Awaitable<void>): void {
  const event = new CustomEvent('AppsembleBootstrap', {
    detail: {
      fn,
      document,
    },
  });
  document.currentScript.dispatchEvent(event);
}

/**
 * Attach the returned node to the shadow root.
 *
 * This convenience wrapper attaches nodes returned by the bootstrap function to the shadow root.
 * This means that the initialization function for a block simply has to return a node.
 *
 * @param fn The bootstrap function to register.
 */
export function attach(fn: (params: BootstrapParams) => Awaitable<HTMLElement | void>): void {
  bootstrap(async params => {
    const { shadowRoot } = params;

    const node = await fn(params);
    if (node instanceof HTMLElement) {
      shadowRoot.appendChild(node);
    }
  });
}
