import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type Action, type BootstrapParams } from '@appsemble/sdk';
import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { ItemCell } from './index.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render the text', () => {
  const onClickMock = vi.fn();
  const onSubmitCheckedMock = vi.fn();

  const onClick = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );
  const onSubmitChecked = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onSubmitCheckedMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );
  const baseField = {
    value: 'test',
  };

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      fields: [baseField],
    },
    actions: {
      onClick,
      onSubmitChecked,
    },
  };

  render(
    <Context.Provider value={props}>
      <ItemCell
        field={baseField}
        index={0}
        item={{ foo: 'bar' }}
        onToggleCheckbox={vi.fn()}
        record={{ foo: 'bar' }}
        repeatedIndex={0}
      />
    </Context.Provider>,
  );
  const textFromField = screen.getByRole('cell');
  expect(textFromField).toMatchInlineSnapshot(`
    <td
      class="cell"
    >
      <div
        class="is-flex is-justify-content-left"
      >
        test
      </div>
    </td>
  `);
});

function renderCell(onClick: Action, value: string): Record<string, unknown> {
  const field = { value };
  const record = { id: 1 };

  render(
    <Context.Provider
      value={{
        ...defaultBootstrapParams,
        parameters: { fields: [field] },
        actions: { onClick, onSubmitChecked: { type: 'noop' } as Action },
      }}
    >
      <ItemCell
        field={field}
        index={2}
        item={record}
        onToggleCheckbox={vi.fn()}
        record={record}
        repeatedIndex={0}
      />
    </Context.Provider>,
  );
  return record;
}

it('should render a button for a cell with a click action', () => {
  const onClickMock = vi.fn();
  const onClick = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickMock(data, context) as Promise<R>;
    },
    { type: 'dialog' as const },
  );
  const record = renderCell(onClick, 'Open');
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));

  expect(onClickMock).toHaveBeenCalledWith(record, { index: 2, repeatedIndex: 0 });
});

it('should render a link for a cell with a link action', () => {
  const onClick = Object.assign(vi.fn(), {
    type: 'link' as const,
    href: (data: { id: number }) => `/items/${data.id}`,
  }) as unknown as Action;
  renderCell(onClick, 'Open');

  expect(screen.getByRole('link', { name: 'Open' }).getAttribute('href')).toBe('/items/1');
});

it('should not render a control for an empty cell', () => {
  const onClick = Object.assign(vi.fn(), { type: 'dialog' as const }) as unknown as Action;
  renderCell(onClick, '');

  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('link')).toBeNull();
});
