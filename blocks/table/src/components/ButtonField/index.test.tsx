import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { ButtonField } from './index.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render the button inside the field', async () => {
  const onClickMock = vi.fn();
  const onClickButtonMock = vi.fn();
  const onSubmitCheckedMock = vi.fn();

  const onClick = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );
  const onClickButton = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickButtonMock(data, context) as Promise<R>;
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

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      fields: [
        {
          button: {
            label: 'Test Button',
          },
        },
      ],
    },
    actions: {
      onClick,
      onSubmitChecked,
      onClickButton,
    },
  };

  render(
    <Context.Provider value={props}>
      <ButtonField
        field={{ button: { label: 'Test Button' }, onClick: 'onClickButton' }}
        index={0}
        item={{ foo: 'bar' }}
        repeatedIndex={0}
      />
    </Context.Provider>,
  );

  const button = screen.getByRole('button');
  expect(button).toMatchInlineSnapshot(`
    <button
      class="button is-normal"
      type="button"
    >
      <span>
        Test Button
      </span>
    </button>
  `);

  await userEvent.click(button);
  expect(onClickButtonMock).toHaveBeenCalledOnce();
});

it('should execute the block onClick action as fallback if not defined for the field', async () => {
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

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      fields: [
        {
          button: {
            label: 'Test Button',
          },
        },
      ],
    },
    actions: {
      onClick,
      onSubmitChecked,
    },
  };

  render(
    <Context.Provider value={props}>
      <ButtonField
        field={{ button: { label: 'Test Button' } }}
        index={0}
        item={{ foo: 'bar' }}
        repeatedIndex={0}
      />
    </Context.Provider>,
  );

  await userEvent.click(screen.getByRole('button'));
  expect(onClickMock).toHaveBeenCalledOnce();
});
