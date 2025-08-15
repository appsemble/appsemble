import { ActionError, remap, type Remapper } from '@appsemble/lang-sdk';
import { Context } from '@appsemble/preact';
import { type BlockUtils, type BootstrapParams, type Messages, type Theme } from '@appsemble/sdk';
import { defaultLocale } from '@appsemble/utils';
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';

import { HeaderComponent } from './index.js';

type BlockProps = BootstrapParams & { ready: (value: PromiseLike<void> | void) => void };

function remapWithContext(remapper: Remapper, data: any, context?: Record<string, any>): unknown {
  return remap(remapper, data, {
    getMessage: null,
    getVariable: null,
    appId: 1,
    url: 'https://example.com/en/example',
    appUrl: 'https://example.com',
    appMemberInfo: null,
    context,
    locale: defaultLocale,
  });
}

function getDefaultUtils(): BlockUtils {
  return {
    showMessage(message) {
      return message;
    },
    formatMessage<T extends keyof Messages>(
      message: T,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...args: Messages[T] extends never ? [] : [Messages[T]]
    ) {
      return message;
    },
    asset(assetId) {
      return assetId;
    },
    fa(icon) {
      return icon;
    },
    remap: remapWithContext,
    isMobile: window.innerWidth < 768,
    menu() {
      return null;
    },
    isActionError(input): input is ActionError {
      return input instanceof ActionError;
    },
    addCleanup() {
      return null;
    },
  };
}

function getDefaultBootstrapParams(): Pick<
  BootstrapParams,
  'data' | 'events' | 'path' | 'pathIndex' | 'shadowRoot' | 'theme' | 'utils'
> & { ready: () => Promise<void> } {
  return {
    data: {},
    path: '',
    pathIndex: '',
    shadowRoot: document?.createElement('div').attachShadow({ mode: 'open' }),
    theme: {} as Theme,
    utils: getDefaultUtils(),
    events: {
      emit: null,
      on: null,
      off: null,
    },
    ready() {
      return Promise.resolve();
    },
  };
}

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
      onDrop: null,
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
      onDrop: null,
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
