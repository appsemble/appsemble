import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams, type IconName } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { DropdownField as DropdownComponent } from './index.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render a dropdown component', async () => {
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

  const dropdownField = {
    dropdown: {
      icon: 'ellipsis-vertical' as IconName,
      options: [{ onClick: 'onClick', label: 'Click' }],
    },
  };

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      fields: [dropdownField],
    },
    actions: {
      onClick,
      onSubmitChecked,
    },
  };

  render(
    <Context.Provider value={props}>
      <DropdownComponent
        field={dropdownField}
        index={0}
        item={{ foo: 'bar' }}
        record={{ foo: 'bar' }}
        repeatedIndex={0}
      />
    </Context.Provider>,
  );

  const testDropdown = screen.getByTestId('dropdown');
  expect(testDropdown).toMatchSnapshot();

  await userEvent.click(testDropdown.getElementsByClassName('dropdown-trigger')[0]);
  await userEvent.click(testDropdown.getElementsByClassName('dropdown-item')[0]);
  expect(onClickMock).toHaveBeenCalledOnce();
});
