import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { cleanup, render, screen } from '@testing-library/preact';
import { userEvent } from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { CheckBoxField } from './index.js';
import { type CheckBox } from '../../../block.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render the checkbox fields', async () => {
  const onClickMock = vi.fn();
  const onSubmitCheckedMock = vi.fn();
  const onChange = vi.fn();

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
          checkbox: {
            disabled: false,
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
      <CheckBoxField
        field={{ checkbox: { disabled: false } }}
        index={0}
        item={{ foo: 'bar' }}
        onChange={onChange}
      />
    </Context.Provider>,
  );
  const checkbox = screen.getByRole('checkbox');
  expect(checkbox).toMatchInlineSnapshot(`
    <input
      type="checkbox"
    />
  `);
  await userEvent.click(checkbox);
  expect(onChange).toHaveBeenCalledOnce();
});

it('should render a disabled checkbox', async () => {
  const onClickMock = vi.fn();
  const onSubmitCheckedMock = vi.fn();
  const onChange = vi.fn();

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

  const checkboxField: CheckBox = {
    checkbox: {
      disabled: true,
    },
  };
  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      fields: [
        {
          ...checkboxField,
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
      <CheckBoxField field={checkboxField} index={0} item={{ foo: 'bar' }} onChange={onChange} />
    </Context.Provider>,
  );
  const checkbox = screen.getByRole('checkbox');
  await userEvent.click(checkbox);
  expect(checkbox.hasAttribute('disabled')).toBeTruthy();
  expect(onChange).not.toHaveBeenCalled();
  cleanup();
  Object.assign(checkboxField.checkbox, { disabled: false });
  render(
    <Context.Provider value={props}>
      <CheckBoxField field={checkboxField} index={0} item={{ foo: 'bar' }} onChange={onChange} />
    </Context.Provider>,
  );
  const checkboxDisabled = screen.getByRole('checkbox');
  expect(checkboxDisabled.getAttribute('disabled')).toBeNull();
});
