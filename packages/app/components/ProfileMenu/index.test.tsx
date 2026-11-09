import { type AppDefinition } from '@appsemble/lang-sdk';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProfileMenuItems } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as appMessagesProvider from '../AppMessagesProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';

const appDefinition = {
  name: 'Test App',
  defaultPage: 'Home',
  notifications: { roles: { Manager: 'opt-in' } },
  security: { default: { role: 'Employee' }, roles: { Employee: {}, Manager: {} } },
  pages: [{ name: 'Home', blocks: [] }],
} as AppDefinition;

function renderProfileMenuItems(
  definition: AppDefinition,
  subscription: { endpoint: string } | null,
): void {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({ definition } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberRoles: ['Employee'],
  } as never);
  vi.spyOn(appMessagesProvider, 'useAppMessages').mockReturnValue({
    getAppMessage: ({ defaultMessage }: { defaultMessage?: string }) => ({
      format: () => defaultMessage,
    }),
  } as never);
  vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue({
    subscription,
  } as never);
  render(
    <IntlProvider locale="en">
      <MemoryRouter>
        <ProfileMenuItems onDemoLogin={vi.fn()} />
      </MemoryRouter>
    </IntlProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProfileMenuItems', () => {
  it('should link a subscribed member without a notification strategy to the settings', () => {
    renderProfileMenuItems(appDefinition, { endpoint: 'https://push.example.com' });
    expect(screen.getByRole('link', { name: 'Settings' })).toBeDefined();
  });

  it('should not link to the settings for a subscription in an app without notifications', () => {
    renderProfileMenuItems(
      { ...appDefinition, notifications: undefined },
      { endpoint: 'https://push.example.com' },
    );
    expect(screen.queryByRole('link', { name: 'Settings' })).toBeNull();
  });
});
