import { getDefaultBootstrapParams } from '@appsemble/block-interaction-tests';
import { Context } from '@appsemble/preact';
import { type Action, type BootstrapParams } from '@appsemble/sdk';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { HeaderComponent } from './index.js';

declare module '@appsemble/sdk' {
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
  interface EventEmitters {
    [K: string]: never;
  }
}

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

const defaultBootstrapParams = getDefaultBootstrapParams();

it('should render a header component', async () => {
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
      item: {
        header: {
          title: 'test',
        },
      },
    },
    actions: {
      onClick,
      onDrop: { type: 'noop' } as Action,
    },
  };

  render(
    <Context.Provider value={props}>
      <HeaderComponent
        dataTestId="header-test"
        index={1}
        isVisible
        item={{ id: 1 }}
        itemHref="href"
        onItemClick={onClick}
      />
    </Context.Provider>,
  );

  const testSelect = screen.getByTestId('header-test');
  expect(testSelect).toMatchSnapshot();
  await userEvent.click(testSelect);
  expect(onClickMock).toHaveBeenCalledOnce();
});

it('should render a header component with a link onClick action', async () => {
  const onClickMock = vi.fn();

  const onClick = Object.assign(
    // eslint-disable-next-line func-names,prefer-arrow-callback
    function <R>(data?: any, context?: Record<string, any>): Promise<R> {
      return onClickMock(data, context) as Promise<R>;
    },
    { type: 'link' as const, href: () => 'href' },
  );

  const props: BlockProps = {
    ...defaultBootstrapParams,
    parameters: {
      item: {
        header: {
          title: 'test',
        },
      },
    },
    actions: {
      onClick,
      onDrop: { type: 'noop' } as Action,
    },
  };

  render(
    <Context.Provider value={props}>
      <HeaderComponent
        dataTestId="header-test"
        index={1}
        isVisible
        item={{ id: 1 }}
        itemHref="href"
        onItemClick={onClick}
      />
    </Context.Provider>,
  );

  const header = screen.getByTestId('header-test');
  expect(header).toMatchSnapshot();
  await userEvent.click(header);
  expect(onClickMock).toHaveBeenCalledOnce();
});
