import {
  type ActionDefinition,
  type AppDefinition,
  type BlockDefinition,
  type ControllerDefinition,
  type PageDefinition,
} from '@appsemble/types';

export type Prefix = (number | string)[];

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type IterCallback<T> = (item: T, path: Prefix) => boolean | void;

interface IterCallbacks {
  onPage?: IterCallback<PageDefinition>;
  onBlockList?: IterCallback<BlockDefinition[]>;
  onBlock?: IterCallback<BlockDefinition>;
  onAction?: IterCallback<ActionDefinition>;
  onController?: IterCallback<ControllerDefinition>;
}

/**
 * Iterate over an action definition and call each callback if relevant.
 *
 * If a callback returns true, the iteration is aborted.
 *
 * @param action The action definition to iterate over.
 * @param callbacks The callbacks to call if a sub definition is found.
 * @param prefix The initial path prefix. This is mainly used for nested iteration.
 * @returns True if any callback returns true, false otherwise.
 */
export function iterAction(
  action: ActionDefinition,
  callbacks: IterCallbacks,
  prefix: Prefix = [],
): boolean {
  if (callbacks.onAction?.(action, prefix)) {
    return true;
  }

  if (action.onSuccess && iterAction(action.onSuccess, callbacks, [...prefix, 'onSuccess'])) {
    return true;
  }

  if (action.onError && iterAction(action.onError, callbacks, [...prefix, 'onError'])) {
    return true;
  }

  if (action.type === 'condition') {
    return Boolean(
      iterAction(action.then, callbacks, [...prefix, 'then']) ||
        iterAction(action.else, callbacks, [...prefix, 'else']),
    );
  }

  if (action.type === 'each') {
    return iterAction(action.do, callbacks, [...prefix, 'do']);
  }

  if ('blocks' in action) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return iterBlockList(action.blocks, callbacks, [...prefix, 'blocks']);
  }

  return false;
}

export function iterController(
  controller: ControllerDefinition,
  callbacks: IterCallbacks,
  prefix: Prefix = [],
): boolean {
  if (callbacks.onController?.(controller, prefix)) {
    return true;
  }

  if (controller.actions) {
    return Object.entries(controller.actions).some(([key, action]) =>
      iterAction(action, callbacks, [...prefix, 'actions', key]),
    );
  }

  return false;
}

/**
 * Iterate over a block definition and call each callback if relevant.
 *
 * If a callback returns true, the iteration is aborted.
 *
 * @param block The block definition to iterate over.
 * @param callbacks The callbacks to call if a sub definition is found.
 * @param prefix The initial path prefix. This is mainly used for nested iteration.
 * @returns True if any callback returns true, false otherwise.
 */
export function iterBlock(
  block: BlockDefinition,
  callbacks: IterCallbacks,
  prefix: Prefix = [],
): boolean {
  if (callbacks.onBlock?.(block, prefix)) {
    return true;
  }

  if (block.actions) {
    return Object.entries(block.actions).some(([key, action]) =>
      iterAction(action, callbacks, [...prefix, 'actions', key]),
    );
  }

  return false;
}

/**
 * Iterate over a block definition list and call each callback if relevant.
 *
 * If a callback returns true, the iteration is aborted.
 *
 * @param blockList The block definition list to iterate over.
 * @param callbacks The callbacks to call if a sub definition is found.
 * @param prefix The initial path prefix. This is mainly used for nested iteration.
 * @returns True if any callback returns true, false otherwise.
 */
export function iterBlockList(
  blockList: BlockDefinition[],
  callbacks: IterCallbacks,
  prefix: Prefix = [],
): boolean {
  if (callbacks.onBlockList?.(blockList, prefix)) {
    return true;
  }

  return blockList.some((block, index) => iterBlock(block, callbacks, [...prefix, index]));
}

/**
 * Iterate over a page definition and call each callback if relevant.
 *
 * If a callback returns true, the iteration is aborted.
 *
 * @param page The page definition to iterate over.
 * @param callbacks The callbacks to call if a sub definition is found.
 * @param prefix The initial path prefix. This is mainly used for nested iteration.
 * @returns True if any callback returns true, false otherwise.
 */
export function iterPage(
  page: PageDefinition,
  callbacks: IterCallbacks,
  prefix: Prefix = [],
): boolean {
  if (callbacks.onPage?.(page, prefix)) {
    return true;
  }

  if (page.type === 'flow' || page.type === 'tabs') {
    let result = false;
    if ('actions' in page) {
      result = Object.entries(page.actions ?? {}).some(([key, action]) =>
        iterAction(action, callbacks, [...prefix, 'actions', key]),
      );
    }

    return (
      result ||
      (page.type === 'flow'
        ? page.steps.some((step, index) =>
            iterBlockList(step.blocks, callbacks, [...prefix, 'steps', index, 'blocks']),
          )
        : page.tabs
          ? page.tabs.some((tab, index) =>
              iterBlockList(tab.blocks, callbacks, [...prefix, 'tabs', index, 'blocks']),
            )
          : iterBlockList(page.definition?.foreach.blocks ?? [], callbacks, [
              ...prefix,
              'tabs',
              0,
              'blocks',
            ]))
    );
  }

  if (page.type === 'loop') {
    let result = false;
    if ('actions' in page) {
      result = Object.entries(page.actions ?? {}).some(([key, action]) =>
        iterAction(action, callbacks, [...prefix, 'actions', key]),
      );
    }
    return (
      result ||
      ['steps.first', 'steps', 'steps.last'].some((suffix) =>
        iterBlockList(page.foreach.blocks, callbacks, [...prefix, suffix, 'blocks']),
      )
    );
  }

  if (page.type === 'container') {
    let result = false;
    for (const containerPage of page.pages) {
      result = iterPage(containerPage, callbacks, prefix);
    }
    return result;
  }

  return iterBlockList(page.blocks, callbacks, [...prefix, 'blocks']);
}

/**
 * Iterate over an app definition and call each callback if relevant.
 *
 * @param app The app definition to iterate over.
 * @param callbacks The callbacks to call if a sub definition is found.
 * @returns True if any callback returns true, false otherwise.
 */
export function iterApp(app: AppDefinition, callbacks: IterCallbacks): boolean {
  if (
    Array.isArray(app.pages) &&
    app.pages.some((page, index) => iterPage(page, callbacks, ['pages', index]))
  ) {
    return true;
  }
  if (app.controller && iterController(app.controller, callbacks, ['controller'])) {
    return true;
  }
  if (app.cron) {
    for (const [name, job] of Object.entries(app.cron)) {
      if (job?.action && iterAction(job.action, callbacks, ['cron', name, 'action'])) {
        return true;
      }
    }
  }
  return false;
}
