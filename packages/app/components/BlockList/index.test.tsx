import { EventEmitter } from 'node:events';

import { remap, type AppDefinition, type BlockDefinition } from '@appsemble/lang-sdk';
import { MessagesProvider } from '@appsemble/react-components';
import { type EventParams } from '@appsemble/sdk';
import { noop } from '@appsemble/utils';
import { cleanup, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';

import { BlockList } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';

vi.mock('../../utils/settings.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/settings.js')>()),
  appControllerCode: 'controller fixture',
  appControllerImplementations: JSON.stringify({
    actions: { failure: {}, success: {} },
    events: { listen: {}, emit: {} },
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.head.innerHTML = '';
});

it('should display error and success messages from controller action callbacks', async () => {
  const blocks: BlockDefinition[] = [{ type: '@test/private', version: '1.0.0', roles: ['admin'] }];
  const definition: AppDefinition = {
    name: 'Controller messages',
    defaultPage: 'Home',
    pages: [{ name: 'Home', blocks }],
    controller: {
      actions: {
        failure: { type: 'message', color: 'danger', body: { prop: 'body' } },
        success: { type: 'message', color: 'success', body: { prop: 'body' } },
      },
      events: { listen: {}, emit: {} },
    },
  };
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition,
    revision: 1,
  } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberGroups: [],
    appMemberRoles: [],
    appMemberInfoRef: { current: undefined },
    isLoggedIn: false,
    logout: noop,
  } as never);
  vi.spyOn(demoAppMembersProvider, 'useDemoAppMembers').mockReturnValue({
    refetchDemoAppMembers: noop,
  } as never);
  vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue(
    {} as never,
  );
  const script = document.createElement('script');
  script.id = 'app-controller';
  document.head.append(script);
  vi.spyOn(script, 'src', 'set').mockImplementation(() => {
    queueMicrotask(() => {
      Object.defineProperty(document, 'currentScript', { configurable: true, value: script });
      script.dispatchEvent(
        new CustomEvent('AppsembleController', {
          detail: {
            document,
            async fn({ actions }: EventParams) {
              await actions.failure({ body: 'Bluetooth permission was denied.' });
              await actions.success({ body: 'The lamp settings are saved.' });
              return {};
            },
          },
        }),
      );
    });
  });
  // eslint-disable-next-line unicorn/prefer-event-target -- BlockList consumes the app event bus.
  const ee = new EventEmitter();
  render(
    <IntlProvider locale="en">
      <MessagesProvider>
        <MemoryRouter>
          <BlockList
            appStorage={{} as never}
            blocks={blocks}
            ee={ee}
            pageDefinition={definition.pages[0]}
            prefix="pages.home"
            prefixIndex="pages.0"
            remap={(mapping, data) => remap(mapping, data, {} as never)}
            showDialog={noop as never}
            showShareDialog={noop as never}
          />
        </MemoryRouter>
      </MessagesProvider>
    </IntlProvider>,
  );

  expect(await screen.findByText('Bluetooth permission was denied.')).toBeDefined();
  expect(await screen.findByText('The lamp settings are saved.')).toBeDefined();
});
