import type {
  ActionDefinition,
  AppDefinition,
  BlockDefinition,
  PageDefinition,
} from '@appsemble/types';

type Prefix = (string | number)[];

type IterCallback<T> = (item: T, path: Prefix) => boolean | void;

interface IterCallbacks {
  onPage?: IterCallback<PageDefinition>;
  onBlockList?: IterCallback<BlockDefinition[]>;
  onBlock?: IterCallback<BlockDefinition>;
  onAction?: IterCallback<ActionDefinition>;
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

  if ('blocks' in action) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return iterBlockList(action.blocks, callbacks, [...prefix, 'blocks']);
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
    if ('actions' in page) {
      return Object.entries(page.actions).some(([key, action]) =>
        iterAction(action, callbacks, [...prefix, 'actions', key]),
      );
    }

    return page.subPages.some((subPage, index) =>
      iterBlockList(subPage.blocks, callbacks, [...prefix, 'subPages', index, 'blocks']),
    );
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
  return app.pages.some((page, index) => iterPage(page, callbacks, ['pages', index]));
}
