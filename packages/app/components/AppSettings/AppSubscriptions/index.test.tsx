import { type AppDefinition } from '@appsemble/lang-sdk';
import { MessagesProvider } from '@appsemble/react-components';
import { render, screen } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppSubscriptions } from './index.js';
import * as appDefinitionProvider from '../../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../../AppMemberProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../../ServiceWorkerRegistrationProvider/index.js';

const appDefinition = {
  name: 'Test App',
  defaultPage: 'Home',
  notifications: { roles: { Manager: 'login' } },
  security: { default: { role: 'Employee' }, roles: { Employee: {}, Manager: {} } },
  pages: [{ name: 'Home', blocks: [] }],
} as AppDefinition;

let mock: MockAdapter;

function renderSubscriptions(
  appMemberRoles: string[],
  subscription: { endpoint: string } | null,
  definition: AppDefinition = appDefinition,
): void {
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({ definition } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({ appMemberRoles } as never);
  vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue({
    subscription,
  } as never);
  render(
    <IntlProvider locale="en" messages={{}}>
      <MessagesProvider>
        <AppSubscriptions />
      </MessagesProvider>
    </IntlProvider>,
  );
}

beforeEach(() => {
  mock = new MockAdapter(axios as ConstructorParameters<typeof MockAdapter>[0]);
  mock.onGet(/\/subscriptions$/).reply(200, {});
});

afterEach(() => {
  mock.restore();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('AppSubscriptions', () => {
  it('should offer the subscribe checkbox to a role with a notification strategy', () => {
    renderSubscriptions(['Manager'], null);
    expect(screen.getByRole('checkbox')).toHaveProperty('checked', false);
  });

  it('should hide the subscribe checkbox from a role without a notification strategy', () => {
    renderSubscriptions(['Employee'], null);
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('should let a subscribed member without a notification strategy unsubscribe', async () => {
    renderSubscriptions(['Employee'], { endpoint: 'https://push.example.com' });
    expect(await screen.findByRole('checkbox')).toHaveProperty('checked', true);
  });

  it('should hide the subscribe checkbox in an app without notifications', async () => {
    renderSubscriptions(
      ['Employee'],
      { endpoint: 'https://push.example.com' },
      {
        ...appDefinition,
        notifications: undefined,
      },
    );
    // Let the subscriptions request settle, after which the checkbox would replace the loader.
    await new Promise((resolve) => {
      setTimeout(resolve);
    });
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
});
