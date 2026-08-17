import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { act, render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { Table } from './bootstrap.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

interface Item {
  id?: number;
  title?: string;
  body?: string;
}

interface SetupOptions {
  /**
   * The `fields` parameter of the block.
   */
  fields?: any[];

  /**
   * The type of the `onSubmitChecked` action.
   */
  onSubmitCheckedType?: 'noop' | 'resource.update';
}

interface Setup {
  /**
   * The payloads emitted on the `checked` event.
   */
  checked: unknown[];

  /**
   * Delivers a `data` event to the block.
   */
  emitData: (data: (Item | null)[] | Item, error?: string) => Promise<void>;

  /**
   * Records the calls to `events.off.data`.
   */
  offData: ReturnType<typeof vi.fn>;

  /**
   * Records the calls to `ready`.
   */
  ready: ReturnType<typeof vi.fn>;

  /**
   * The payloads emitted on the `sorted` event.
   */
  sorted: unknown[];

  /**
   * The data `onSubmitChecked` was dispatched with.
   */
  submitted: unknown[];

  /**
   * Unmounts the block.
   */
  unmount: () => void;
}

/**
 * Click an element and flush the resulting state updates.
 *
 * Preact does not flush updates triggered by user-event until the next act boundary, so the
 * emitted events would otherwise lag one interaction behind.
 *
 * @param element The element to click.
 */
async function click(element: Element): Promise<void> {
  await act(async () => {
    await userEvent.click(element);
  });
}

function setup({
  fields = [{ label: 'Title', name: 'title', value: { prop: 'title' } }],
  onSubmitCheckedType = 'resource.update',
}: SetupOptions = {}): Setup {
  const checked: unknown[] = [];
  const sorted: unknown[] = [];
  const submitted: unknown[] = [];
  const offData = vi.fn();
  const ready = vi.fn();
  let dataCallback: (data: (Item | null)[] | Item, error?: string) => void;

  const onSubmitChecked = Object.assign(
    (data?: any): Promise<unknown> => {
      submitted.push(data);
      return Promise.resolve(data);
    },
    { type: onSubmitCheckedType },
  );
  const onClick = Object.assign((data?: any): Promise<unknown> => Promise.resolve(data), {
    type: 'noop' as const,
  });

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: { fields },
    actions: { onClick, onSubmitChecked } as unknown as BlockProps['actions'],
    events: {
      emit: {
        sorted(data: unknown) {
          sorted.push(data);
          return Promise.resolve(true);
        },
        checked(data: unknown) {
          checked.push(data);
          return Promise.resolve(true);
        },
      },
      on: {
        data(callback: unknown) {
          dataCallback = callback as typeof dataCallback;
          return true;
        },
      },
      off: { data: offData },
    } as unknown as BlockProps['events'],
    ready,
  };

  const { unmount } = render(
    <Context.Provider value={props}>
      <Table {...props} />
    </Context.Provider>,
  );

  return {
    checked,
    async emitData(data, error) {
      await act(() => {
        dataCallback(data, error);
      });
    },
    offData,
    ready,
    sorted,
    submitted,
    unmount,
  };
}

it('should show a loader and signal readiness until data arrives', () => {
  const { ready } = setup();

  expect(screen.getByTestId('loader-comp')).toBeDefined();
  expect(screen.queryByRole('grid')).toBeNull();
  expect(ready).toHaveBeenCalledWith();
});

it('should show the error message when the data event reports an error', async () => {
  const { emitData } = setup();

  await emitData([], 'Something broke');

  expect(screen.getByText('error')).toBeDefined();
  expect(screen.queryByRole('grid')).toBeNull();
});

it('should recover from an error when later data arrives', async () => {
  const { emitData } = setup();

  await emitData([], 'Something broke');
  await emitData([{ id: 1, title: 'Recovered' }]);

  expect(screen.queryByText('error')).toBeNull();
  expect(screen.getByRole('grid')).toBeDefined();
});

it('should show the empty message when there is nothing to display', async () => {
  const { emitData } = setup();

  await emitData([]);

  expect(screen.getByText('emptyMessage')).toBeDefined();
});

it('should render a single item that is not wrapped in an array', async () => {
  const { emitData } = setup();

  await emitData({ id: 1, title: 'Only one' });

  expect(screen.getAllByRole('row')).toHaveLength(2);
  expect(screen.getByText('Only one')).toBeDefined();
});

it('should drop empty entries from the received data', async () => {
  const { emitData } = setup();

  await emitData([{ id: 1, title: 'Kept' }, null, { id: 2, title: 'Also kept' }]);

  expect(screen.getAllByRole('row')).toHaveLength(3);
});

it('should omit the header row when no field has a label', async () => {
  const { emitData } = setup({ fields: [{ value: { prop: 'title' } }] });

  await emitData([{ id: 1, title: 'Unlabelled' }]);

  expect(screen.queryByRole('columnheader')).toBeNull();
  expect(screen.getAllByRole('row')).toHaveLength(1);
});

it('should cycle the sort order of a column between ascending and descending', async () => {
  const { emitData, sorted } = setup();

  await emitData([{ id: 1, title: 'Sortable' }]);
  const header = screen.getByRole('columnheader', { name: /Title/ });

  await click(header);
  await click(header);

  expect(sorted).toStrictEqual([
    { field: '', order: 'asc' },
    { field: 'title', order: 'asc' },
    { field: 'title', order: 'desc' },
  ]);
});

it('should restart at ascending when a different column is sorted', async () => {
  const { emitData, sorted } = setup({
    fields: [
      { label: 'Title', name: 'title', value: { prop: 'title' } },
      { label: 'Body', name: 'body', value: { prop: 'body' } },
    ],
  });

  await emitData([{ id: 1, title: 'a', body: 'b' }]);

  await click(screen.getByRole('columnheader', { name: /Title/ }));
  await click(screen.getByRole('columnheader', { name: /Title/ }));
  await click(screen.getByRole('columnheader', { name: /Body/ }));

  expect(sorted.at(-1)).toStrictEqual({ field: 'body', order: 'asc' });
});

it('should not make a column without a name sortable', async () => {
  const { emitData, sorted } = setup({
    fields: [{ label: 'Title', value: { prop: 'title' } }],
  });

  await emitData([{ id: 1, title: 'Not sortable' }]);
  await click(screen.getByRole('columnheader', { name: /Title/ }));

  expect(sorted).toStrictEqual([{ field: '', order: 'asc' }]);
});

it('should emit the checked items as they are selected and deselected', async () => {
  const { checked, emitData } = setup({
    fields: [{ checkbox: {} }, { label: 'Title', name: 'title', value: { prop: 'title' } }],
  });

  await emitData([
    { id: 1, title: 'First' },
    { id: 2, title: 'Second' },
  ]);

  const [first] = screen.getAllByRole('checkbox');
  await click(first);
  await click(first);

  expect(checked.at(-2)).toStrictEqual([{ id: 1, title: 'First' }]);
  expect(checked.at(-1)).toStrictEqual([]);
});

it('should submit the checked items', async () => {
  const { emitData, submitted } = setup({
    fields: [{ checkbox: {} }, { label: 'Title', name: 'title', value: { prop: 'title' } }],
  });

  await emitData([{ id: 1, title: 'First' }]);
  await click(screen.getAllByRole('checkbox')[0]);
  await click(screen.getByRole('button', { name: 'submitChecked' }));

  expect(submitted).toStrictEqual([[{ id: 1, title: 'First' }]]);
});

it('should not offer to submit when the submit action is not configured', async () => {
  const { emitData } = setup({
    fields: [{ checkbox: {} }, { label: 'Title', name: 'title', value: { prop: 'title' } }],
    onSubmitCheckedType: 'noop',
  });

  await emitData([{ id: 1, title: 'First' }]);
  await click(screen.getAllByRole('checkbox')[0]);

  expect(screen.queryByRole('button', { name: 'submitChecked' })).toBeNull();
});

it('should stop listening for data when unmounted', async () => {
  const { emitData, offData, unmount } = setup();

  await emitData([{ id: 1, title: 'Listening' }]);
  unmount();

  expect(offData.mock.calls).toHaveLength(1);
});
