import { type Action, type BootstrapParams, type Remapper } from '@appsemble/sdk';
import { expect, it, vi } from 'vitest';

import { ActionButton } from './bootstrap.js';

interface SetupOptions {
  /**
   * The data the block is rendered with.
   */
  data?: unknown;

  /**
   * When set, `onClick` is a link action resolving to this URL.
   */
  href?: string;

  /**
   * The `title` parameter of the block.
   */
  title?: Remapper;
}

interface Setup {
  /**
   * The data each dispatch of the `onClick` action was called with.
   */
  dispatched: unknown[];

  /**
   * The node rendered by the block.
   */
  node: HTMLAnchorElement | HTMLButtonElement;

  /**
   * The `remap` util the block was given.
   */
  remap: ReturnType<typeof vi.fn>;
}

function setup({ data = { id: 1 }, href, title }: SetupOptions = {}): Setup {
  const dispatched: unknown[] = [];
  const dispatch = (clickData: unknown): Promise<unknown> => {
    dispatched.push(clickData);
    return Promise.resolve(clickData);
  };
  const onClick =
    href == null
      ? Object.assign(dispatch, { type: 'noop' as const })
      : Object.assign(dispatch, { type: 'link' as const, href: () => href });

  // The block resolves `title` through the host's remapper, so this stands in for it rather than
  // pulling in the full remapper implementation.
  const remap = vi.fn((remapper: Remapper, remapData: any) =>
    remapper == null ? undefined : remapData?.[(remapper as { prop: string }).prop],
  );

  const node = ActionButton({
    data,
    parameters: { icon: 'plus', title },
    actions: { onClick: onClick as unknown as Action },
    utils: { fa: (icon: string) => `fas fa-${icon}`, remap },
  } as unknown as BootstrapParams);

  return { dispatched, node, remap };
}

function click(node: HTMLElement): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  node.dispatchEvent(event);
  return event;
}

it('should render a button carrying the configured icon', () => {
  const { node } = setup();

  expect(node.tagName).toBe('BUTTON');
  expect((node as HTMLButtonElement).type).toBe('button');
  expect(node.querySelector('i')?.className).toBe('fas fa-plus');
});

it('should dispatch the click action with the block data', () => {
  const { dispatched, node } = setup({ data: { id: 42 } });

  click(node);

  expect(dispatched).toStrictEqual([{ id: 42 }]);
});

it('should render a link action as an anchor whose target is resolvable without clicking', () => {
  const { node } = setup({ href: 'https://example.com/next' });

  expect(node.tagName).toBe('A');
  expect((node as HTMLAnchorElement).href).toBe('https://example.com/next');
  expect(node.querySelector('i')?.className).toBe('fas fa-plus');
});

it('should leave navigation to the action instead of following the anchor', () => {
  const { dispatched, node } = setup({ href: 'https://example.com/next' });

  const event = click(node);

  expect(event.defaultPrevented).toBe(true);
  expect(dispatched).toHaveLength(1);
});

it('should describe the button using the remapped title', () => {
  const { node, remap } = setup({ data: { name: 'Delete note' }, title: { prop: 'name' } });

  expect(remap).toHaveBeenCalledWith({ prop: 'name' }, { name: 'Delete note' });
  expect(node.title).toBe('Delete note');
});

it('should leave the title empty when none is configured', () => {
  const { node } = setup();

  expect(node.title).toBe('');
});
