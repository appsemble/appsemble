import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type BootstrapParams } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { DropdownComponent } from './index.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render a dropdown component', async () => {
  const onClickMock = vi.fn();

  const onClick = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickMock(data, context) as Promise<R>;
    },
    { type: 'noop' as const },
  );

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      dropdown: {
        icon: 'ellipsis-vertical',
        options: [{ onClick: 'onClick', label: 'Click' }],
      },
    },
    actions: {
      onClick,
      onAvatarClick: null,
      onButtonClick: null,
      onLoadReply: null,
      onSubmitReply: null,
    },
  };

  render(
    <Context.Provider value={props}>
      <DropdownComponent
        content={{ id: 1, status: '', photos: [] }}
        dropdown={props.parameters.dropdown}
      />
    </Context.Provider>,
  );

  const testDropdown = screen.getByTestId('dropdown');
  expect(testDropdown).toMatchSnapshot();

  await userEvent.click(testDropdown.getElementsByClassName('dropdown-trigger')[0]);
  await userEvent.click(testDropdown.getElementsByClassName('dropdown-item')[0]);
  expect(onClickMock).toHaveBeenCalledOnce();
});
