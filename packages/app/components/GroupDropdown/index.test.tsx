import { type AppDefinition } from '@appsemble/lang-sdk';
import { type AppMemberGroup } from '@appsemble/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactNode, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { Router } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GroupDropdown } from './index.js';
import { AppRoutes } from '../AppRoutes/index.js';

interface TestAppMemberState {
  appMemberGroups: AppMemberGroup[];
  appMemberRoles: [];
  appMemberSelectedGroup: AppMemberGroup | undefined;
  isLoggedIn: boolean;
  setAppMemberSelectedGroup: (group: AppMemberGroup) => void;
}

const testState = vi.hoisted(() => ({
  appMember: {} as TestAppMemberState,
  definition: {
    name: 'Test App',
    defaultPage: 'Home',
    pages: [{ name: 'Home', blocks: [] }],
  } as unknown as AppDefinition,
}));
const nullComponent = vi.hoisted(() => () => null);

vi.mock('../AppDefinitionProvider/index.js', () => ({
  useAppDefinition: () => ({ definition: testState.definition }),
}));

vi.mock('../AppMemberProvider/index.js', () => ({
  useAppMember: () => testState.appMember,
}));

vi.mock('../AppMessagesProvider/index.js', () => ({
  useAppMessages: () => ({
    getAppMessage: ({ id }: { id: string }) => ({ format: () => id }),
    messagesReady: true,
  }),
}));

vi.mock('../AppDebug/index.js', () => ({ AppDebug: nullComponent }));
vi.mock('../AppInvite/index.js', () => ({ AppInvite: nullComponent }));
vi.mock('../AppSettings/index.js', () => ({ AppSettings: nullComponent }));
vi.mock('../EditPassword/index.js', () => ({ EditPassword: nullComponent }));
vi.mock('../GroupInvite/index.js', () => ({ GroupInvite: nullComponent }));
vi.mock('../Login/index.js', () => ({ Login: nullComponent }));
vi.mock('../OpenIDCallback/index.js', () => ({ OpenIDCallback: nullComponent }));
vi.mock('../Register/index.js', () => ({ Register: nullComponent }));
vi.mock('../ResetPassword/index.js', () => ({ ResetPassword: nullComponent }));
vi.mock('../SentryFeedback/index.js', () => ({ SentryFeedback: nullComponent }));
vi.mock('../Verify/index.js', () => ({ Verify: nullComponent }));

vi.mock('../Page/index.js', async () => {
  const { createElement, useState: usePageState } = await import('react');
  const Page = (): ReactNode => {
    const [loadedGroup] = usePageState(
      testState.appMember.appMemberSelectedGroup?.name ?? 'No Group',
    );
    return createElement('p', { role: 'status' }, `Loaded data for ${loadedGroup}`);
  };

  return { Page };
});

function AppHarness(): ReactNode {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<AppMemberGroup>();
  const groups = useMemo<AppMemberGroup[]>(() => [{ id: 1, name: 'Team One', role: 'Member' }], []);

  testState.appMember = {
    appMemberGroups: groups,
    appMemberRoles: [],
    appMemberSelectedGroup: selectedGroup,
    isLoggedIn,
    setAppMemberSelectedGroup: setSelectedGroup,
  } as never;

  const navigator = useMemo(
    () => ({
      createHref: () => '/en/Home',
      encodeLocation: (location: object) => location,
      go: () => setIsLoggedIn(false),
      push: vi.fn(),
      replace: vi.fn(),
    }),
    [],
  );

  return (
    <IntlProvider locale="en" messages={{}}>
      <Router location="/en/Home" navigator={navigator as never}>
        {isLoggedIn ? (
          <>
            <GroupDropdown />
            <AppRoutes />
          </>
        ) : (
          <p>Login</p>
        )}
      </Router>
    </IntlProvider>
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('GroupDropdown', () => {
  it('should keep the member logged in and reload page data when switching groups', async () => {
    render(<AppHarness />);

    expect(screen.getByRole('status').textContent).toBe('Loaded data for No Group');

    fireEvent.click(screen.getByRole('button', { name: 'Group Team One' }));

    await waitFor(() => {
      expect(screen.queryByText('Login')).toBeNull();
      expect(screen.getByRole('status').textContent).toBe('Loaded data for Team One');
    });
  });
});
