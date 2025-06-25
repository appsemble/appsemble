import {
  type Action,
  type ActionError,
  type BaseMessage,
  type BulmaColor,
  type BulmaSize,
  type Theme,
} from '@appsemble/types';
import { type IconName } from '@fortawesome/fontawesome-common-types';
import { type Promisable } from 'type-fest';

export { type IconName };
export { type Action, type BulmaColor, type BulmaSize, type Theme };

/**
 * A user defined remapper function.
 */
export type Remapper = object[] | boolean | number | object | string;

/**
 * Actions defined on a block.
 *
 * If a block uses actions, extend this interface using module augmentation. The keys are the names
 * of the events the block supports.
 *
 * @example
 * declare module '@appsemble/sdk' {
 *   interface Actions {
 *     onClick: {}
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Actions {}

/**
 * Messages defined on a block.
 *
 * If a block uses messages, extend this interface using module augmentation.
 * The keys are the names of the messages.
 * The types are either `never` if the message doesn’t support parameters
 * or an object containing the keys of values and the type of the value.
 *
 * @example
 * declare module '@appsemble/sdk' {
 *   interface Messages {
 *     exampleMessage: never;
 *     hello: { person: string };
 *   }
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Messages {}

/**
 * Event emitters defined on a block.
 *
 * If a block emits events, extend this interface using module augmentation. The keys are the names
 * of the events the block can emit.
 *
 * @example
 * declare module '@appsemble/sdk' {
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
 * declare module '@appsemble/sdk' {
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
 * declare module '@appsemble/sdk' {
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

export type PageParameters = Record<string, string>;

/**
 * A menu item that can be displayed in addition to the normal app menu.
 */
export interface MenuItem {
  /**
   * The title of the menu item.
   */
  title: string;

  /**
   * The icon to display next to the title.
   */
  icon?: IconName;

  /**
   * The color to use for the icon.
   */
  iconColor?: BulmaColor;

  /**
   * The click handler for when the menu item is clicked.
   */
  onClick: () => void;

  /**
   * The submenu items associated with this menu item.
   */
  submenu?: Omit<MenuItem, 'submenu'>[];

  /**
   * Whether the item is considered active.
   */
  active?: boolean;
}

export interface Message extends BaseMessage {
  /**
   * The content of the message to display.
   */
  body: string;
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
   * Test if the input is an action error.
   *
   * @param input The input to test
   * @returns Whether or not the input is an action error.
   */
  isActionError: (input: unknown) => input is ActionError;

  /**
   * Remap data based in a user defined remapper function.
   *
   * @param remapper The user defined remapper function.
   * @param data The data to remap.
   * @param context The context to retrieve contextual data from.
   * @returns The result of the remapped data.
   */
  remap: (
    remapper: Remapper | undefined,
    data: unknown,
    context?: Record<string, unknown>,
  ) => unknown;
}

export interface BlockUtils extends Utils {
  /**
   * Show a bulma style message.
   */
  showMessage: (message: Message | string) => void;

  /**
   * Formats a message using ICU syntax.
   */
  formatMessage: <T extends keyof Messages>(
    message: T,
    ...args: Messages[T] extends never ? [] : [Messages[T]]
  ) => string;

  /**
   * Get a URL serving an asset for the given asset id.
   *
   * @param assetId The id of the asset whose URL to get.
   * @returns The URL that matches the given asset id.
   */
  asset: (assetId: string) => string;

  /**
   * Convert a FontAwesome icon name into a valid FontAwesome CSS class.
   *
   * @param icon The FontAwesome icon.
   * @returns String containing the FontAwesome classes for the icon.
   */
  fa: (icon: IconName) => string;

  /**
   * @param items The list of menu items to display.
   * @param header A header that can be used to separate from other block menus.
   */
  menu: (items: MenuItem[], header?: string) => void;

  /**
   * @returns Whether the current user is using a mobile device.
   */
  isMobile: boolean;
}

export interface Events {
  /**
   * Emit an Appsemble event.
   *
   * @param type The type of event to emit.
   * @param data Data to emit with the event.
   * @returns Boolean indicating whether an emitter is implemented or not.
   */
  emit: { [K in keyof EventEmitters]: (data: unknown, error?: string) => Promise<boolean> };

  /**
   * Remove an event listener for an Appsemble event.
   *
   * @param type The type of event to listen remove the listener from.
   * @param callback The callback to remove.
   * @returns Boolean indicating whether a listener is implemented or not.
   */
  off: {
    [K in keyof EventListeners]: <T>(callback: (data: T, error?: string) => void) => boolean;
  };

  /**
   * Add an event listener for an Appsemble event.
   *
   * @param type The type of event to listen on.
   * @param callback A callback to register for the event.
   * @returns Boolean indicating whether a listener is implemented or not.
   */
  on: {
    [K in keyof EventListeners]: <T>(callback: (data: T, error?: string) => void) => boolean;
  };
}

export interface EventParams {
  /**
   * The actions that may be dispatched by the block.
   */
  actions: { [K in keyof Actions]: Action };

  /**
   * Any kind of data that has been passed in by some context.
   */
  data: unknown;

  /**
   * Event related functions and constants.
   */
  events: Events;

  /**
   * Some utility functions provided by the Appsemble app framework.
   */
  utils: Utils;
}

/**
 * The parameters that get passed to the bootstrap function.
 */
export interface BootstrapParams extends EventParams {
  /**
   * URL parameters of the current route.
   *
   * If the page on which the block is rendered, has parameters specified on a page level, the
   * parameter keys and values of the page will be extracted and set as this object.
   */
  pageParameters?: PageParameters;

  /**
   * The path of the block as it is being rendered on the page using the page’s normalized name.
   */
  path: string;

  /**
   * The path of the block as it is being rendered on the page using the page’s index.
   */
  pathIndex: string;

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
  utils: BlockUtils;

  /**
   * The parameters as they are defined in the app definition.
   */
  parameters: Parameters;
}

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type BootstrapFunction = (params: BootstrapParams) => Promisable<Element | void>;

export interface AppsembleBootstrapEvent extends CustomEvent {
  detail: {
    fn: BootstrapFunction;
    document: Document;
  };
}

/**
 * Register a bootstrap function.
 *
 * @param fn The bootstrap function to register
 *
 *   If the function returns an element, it’s appended to the shadow root.
 */
export function bootstrap(fn: BootstrapFunction): void {
  const event: AppsembleBootstrapEvent = new CustomEvent('AppsembleBootstrap', {
    detail: {
      fn,
      document,
    },
  });
  if (document.currentScript) {
    document.currentScript.dispatchEvent(event);
  }
}

export type HandlerFunction = (...params: any[]) => Promisable<unknown>;

export type ControllerFunction = (
  params: EventParams,
) => Promisable<Record<keyof Actions, HandlerFunction>>;

export interface AppsembleControllerEvent extends CustomEvent {
  detail: {
    fn: ControllerFunction;
    document: Document;
  };
}

/**
 * Register a controller function.
 *
 * @param fn The controller function to register
 */
export function controller(fn: ControllerFunction): void {
  const event: AppsembleControllerEvent = new CustomEvent('AppsembleController', {
    detail: {
      fn,
      document,
    },
  });
  if (document.currentScript) {
    document.currentScript.dispatchEvent(event);
  }
}
