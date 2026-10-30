import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams, type IconName } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { DropdownField as DropdownComponent } from './index.js';
import { type Dropdown } from '../../../block.js';
import messages from '../../../i18n/en.json' with { type: 'json' };

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
  expect(onClickMock.mock.calls).toHaveLength(1);
});

function renderDropdown(field: Dropdown): void {
  const props = {
    ...defaultBootstrapParams,
    parameters: { fields: [field] },
    utils: {
      ...defaultBootstrapParams.utils,
      formatMessage: (message: keyof typeof messages) => messages[message],
    },
  } as unknown as BlockProps;

  render(
    <Context.Provider value={props}>
      <DropdownComponent field={field} index={0} item={{}} record={{}} repeatedIndex={0} />
    </Context.Provider>,
  );
}

it.each([
  { label: 'Actions', name: 'Actions' },
  { label: undefined, name: 'More options' },
])('should name an icon-only dropdown $name', ({ label, name }) => {
  renderDropdown({
    label,
    dropdown: { icon: 'ellipsis-vertical', options: [{ onClick: 'onClick', label: 'Edit' }] },
  });

  expect(screen.getByRole('button', { name })).toBeDefined();
});

it('should name a dropdown by its visible label', () => {
  renderDropdown({
    label: 'Actions',
    dropdown: {
      icon: 'ellipsis-vertical',
      label: 'Manage',
      options: [{ onClick: 'onClick', label: 'Edit' }],
    },
  });

  expect(screen.getByRole('button', { name: 'Manage' })).toBeDefined();
});
