import { EventEmitter } from 'node:events';

import { type AppDefinition, type FlowPageDefinition } from '@appsemble/lang-sdk';
import { noop } from '@appsemble/utils';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowPage } from './index.js';
import { type FlowActions } from '../../types.js';
import { type AppStorage } from '../../utils/storage.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as appVariablesProvider from '../AppVariablesProvider/index.js';
import * as demoAppMembersProvider from '../DemoAppMembersProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';

// The blocks of a step load scripts, so a button stands in for a block that moves to the next step.
vi.mock('../BlockList/index.js', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- This mocks a component export.
  BlockList: ({ flowActions }: { readonly flowActions: FlowActions }) => (
    <button onClick={() => flowActions.next({})} type="button">
      Next
    </button>
  ),
}));

beforeEach(() => {
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberGroups: [],
    appMemberInfoRef: { current: undefined },
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage }: { defaultMessage?: string }) => ({
      format: () => defaultMessage,
    }),
    getMessage: () => ({ format: () => '' }),
  } as never);
  vi.spyOn(appVariablesProvider, 'useAppVariables').mockReturnValue({ getVariable: noop } as never);
  vi.spyOn(demoAppMembersProvider, 'useDemoAppMembers').mockReturnValue({
    refetchDemoAppMembers: noop,
  } as never);
  vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue(
    {} as never,
  );
});

const pageDefinition: FlowPageDefinition = {
  name: 'Survey',
  type: 'flow',
  steps: [
    { name: 'One', blocks: [] },
    { name: 'Two', blocks: [] },
  ],
};

function renderFlowPage(): void {
  render(
    <IntlProvider locale="en">
      <MemoryRouter initialEntries={['/en/survey']}>
        <input aria-label="Note" />
        <main tabIndex={-1}>
          <FlowPage
            appDefinition={{ name: 'Test App', pages: [pageDefinition] } as AppDefinition}
            appStorage={{} as AppStorage}
            data={{}}
            // eslint-disable-next-line unicorn/prefer-event-target
            ee={new EventEmitter()}
            pageDefinition={pageDefinition}
            prefix="pages.survey"
            prefixIndex="pages.0"
            remap={noop}
            setData={noop}
            showDialog={() => noop}
            showShareDialog={() => Promise.resolve()}
            stepRef={{ current: undefined }}
          />
        </main>
      </MemoryRouter>
    </IntlProvider>,
  );
}

describe('FlowPage', () => {
  it('should move focus to the page when the flow moves to the next step', async () => {
    renderFlowPage();

    expect(document.activeElement).toBe(document.body);

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(document.activeElement).toBe(screen.getByRole('main'));
  });

  it('should keep focus outside the step when the flow moves to the next step', () => {
    renderFlowPage();
    const note = screen.getByRole('textbox', { name: 'Note' });
    note.focus();

    // A block moves to the next step without user input, so focus stays on the note.
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(document.activeElement).toBe(note);
  });
});
