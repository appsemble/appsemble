import { EventEmitter } from 'node:events';

import { remap } from '@appsemble/lang-sdk';
import { noop } from '@appsemble/utils';
import { cleanup, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { PageDialog } from './index.js';
import { type ShowDialogParams } from '../../types.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';

beforeEach(() => {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({
    definition: { name: 'Test app', defaultPage: 'Home', pages: [] },
  } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: [],
    isLoggedIn: true,
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage }: { defaultMessage: string }) => ({
      format: () => defaultMessage,
    }),
  } as never);
  vi.spyOn(demoAppMembersProvider, 'useDemoAppMembers').mockReturnValue({
    refetchDemoAppMembers: noop,
  } as never);
});

afterEach(cleanup);

function renderPageDialog(dialog: Partial<ShowDialogParams> = {}): void {
  render(
    <IntlProvider locale="en">
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
            ...dialog,
          }}
          // eslint-disable-next-line unicorn/prefer-event-target
          ee={new EventEmitter()}
          pageDefinition={{ name: 'Home', blocks: [] }}
          remap={(mapper, data) => remap(mapper, data, {} as never)}
          showDialog={() => noop}
          showShareDialog={() => Promise.resolve()}
        />
      </MemoryRouter>
    </IntlProvider>,
  );
}

it('should render the dialog title from the data passed to its action', async () => {
  renderPageDialog();

  expect(await screen.findByText('Nursery lamp')).not.toBeNull();
});

it('should render a modal dialog named by its title', () => {
  renderPageDialog();

  expect(screen.getByRole('dialog', { name: 'Nursery lamp' })).not.toBeNull();
  expect(screen.getByRole('heading', { name: 'Nursery lamp' })).not.toBeNull();
});

it('should give the close button an accessible name when the dialog is closable', () => {
  renderPageDialog({ closable: true });

  expect(screen.getByRole('button', { name: 'Close' })).not.toBeNull();
});

it('should close the dialog when escape is pressed if it is closable', async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  renderPageDialog({ closable: true, close });

  await user.keyboard('{Escape}');

  expect(close).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ key: 'Escape' }));
});

it('should not close the dialog when escape is pressed if it is not closable', async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  renderPageDialog({ closable: false, close });

  await user.keyboard('{Escape}');

  expect(close).not.toHaveBeenCalled();
});
