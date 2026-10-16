import { type Action, type BootstrapParams, type Remapper } from '@appsemble/sdk';
import { expect, it } from 'vitest';

import { Tiles } from './bootstrap.js';

interface Tile {
  image?: string;
  text: string;
}

interface SetupOptions {
  /**
   * When set, `onClick` is a link action resolving to this URL.
   */
  href?: string;

  /**
   * Whether `onClick` is a noop action, as when the app defines no click action.
   */
  noop?: boolean;
}

interface Setup {
  /**
   * The data each dispatch of the `onClick` action was called with.
   */
  dispatched: unknown[];

  /**
   * Delivers a `data` event to the block.
   */
  emitData: (data: Tile[]) => void;

  /**
   * The node rendered by the block.
   */
  node: HTMLElement;
}

function setup({ href, noop = false }: SetupOptions = {}): Setup {
  const dispatched: unknown[] = [];
  const dispatch = (clickData: unknown): Promise<unknown> => {
    dispatched.push(clickData);
    return Promise.resolve(clickData);
  };
  const onClick = noop
    ? Object.assign(dispatch, { type: 'noop' as const })
    : href == null
      ? Object.assign(dispatch, { type: 'dialog' as const })
      : Object.assign(dispatch, { type: 'link' as const, href: () => href });
  let dataCallback: ((data: Tile[]) => void) | undefined;

  const node = Tiles({
    actions: { onClick: onClick as unknown as Action },
    events: {
      on: {
        data(callback: (data: Tile[]) => void) {
          dataCallback = callback;
          return true;
        },
      },
    },
    parameters: { image: { prop: 'image' }, text: { prop: 'text' } },
    utils: {
      asset: (id: string) => `/assets/${id}`,
      formatMessage: (id: string) => id,
      remap: (remapper: Remapper, data: any) =>
        remapper == null ? undefined : data[(remapper as { prop: string }).prop],
    },
  } as unknown as BootstrapParams);

  return {
    dispatched,
    emitData(data) {
      dataCallback?.(data);
    },
    node,
  };
}

it('should render each tile as a button', () => {
  const { dispatched, emitData, node } = setup();
  const tile = { text: 'Sounds' };

  emitData([tile]);
  const [button] = node.querySelectorAll('button');
  button.click();

  expect(button.textContent).toBe('Sounds');
  expect(dispatched).toStrictEqual([tile]);
});

it('should render each tile as a link for a link action', () => {
  const { emitData, node } = setup({ href: '/sounds' });

  emitData([{ text: 'Sounds' }]);

  expect(node.querySelector('a')?.getAttribute('href')).toBe('/sounds');
  expect(node.querySelector('button')).toBeNull();
});

it('should hide the image from screen readers since the text names the tile', () => {
  const { emitData, node } = setup();

  emitData([{ image: 'speaker.png', text: 'Sounds' }]);

  expect(node.querySelector('img')?.getAttribute('alt')).toBe('');
});

it('should not render a control for a tile without a click action', () => {
  const { emitData, node } = setup({ noop: true });

  emitData([{ text: 'Sounds' }]);

  expect(node.textContent).toBe('Sounds');
  expect(node.querySelector('button, a')).toBeNull();
});
