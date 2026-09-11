import { EventEmitter } from 'node:events';

import { remap } from '@appsemble/lang-sdk';
import { noop } from '@appsemble/utils';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';

import { PageDialog } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';

afterEach(cleanup);

it('should render the dialog title from the data passed to its action', async () => {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: { name: 'Test app', defaultPage: 'Home', pages: [] },
  } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: [],
    isLoggedIn: true,
  } as never);
  vi.spyOn(demoAppMembersProvider, 'useDemoAppMembers').mockReturnValue({
    refetchDemoAppMembers: noop,
  } as never);

  render(
    <MemoryRouter>
      <PageDialog
        appStorage={{} as never}
        dialog={{
          actionCreators: {},
          blocks: [],
          close: noop,
          data: { lamp: { name: 'Nursery lamp' } },
          fullscreen: false,
          prefix: 'pages.Home.blocks.0.actions.onClick',
          prefixIndex: 'pages.0.blocks.0.actions.onClick',
          title: { prop: ['lamp', 'name'] },
        }}
        // eslint-disable-next-line unicorn/prefer-event-target
        ee={new EventEmitter()}
        pageDefinition={{ name: 'Home', blocks: [] }}
        remap={(mapper, data) => remap(mapper, data, {} as never)}
        showDialog={() => noop}
        showShareDialog={() => Promise.resolve()}
      />
    </MemoryRouter>,
  );

  expect(await screen.findByText('Nursery lamp')).not.toBeNull();
});
