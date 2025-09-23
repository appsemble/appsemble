import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import { expect, it, vi } from 'vitest';

import { ItemRow } from './index.js';

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
  const fields = [
    {
      value: 'test',
    },
    { value: 'foo' },
    { value: 'bar' },
  ];
  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      fields,
    },
    actions: {
      onClick,
      onSubmitChecked,
    },
  };

  render(
    <Context.Provider value={props}>
      <ItemRow index={0} item={{ foo: 'bar' }} onToggleCheckbox={vi.fn()} />
    </Context.Provider>,
  );

  const table = screen.getAllByRole('gridcell');
  expect(table).toMatchInlineSnapshot(`
    [
      <td
        role="gridcell"
      >
        <div
          class="is-flex is-justify-content-left"
        >
          test
        </div>
      </td>,
      <td
        role="gridcell"
      >
        <div
          class="is-flex is-justify-content-left"
        >
          foo
        </div>
      </td>,
      <td
        role="gridcell"
      >
        <div
          class="is-flex is-justify-content-left"
        >
          bar
        </div>
      </td>,
    ]
  `);
});
