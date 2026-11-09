import { type AppDefinition } from '@appsemble/lang-sdk';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PermissionRequest } from './index.js';
import * as appDefinitionProvider from '../AppDefinitionProvider/index.js';
import * as appMemberProvider from '../AppMemberProvider/index.js';
import * as serviceWorkerRegistrationProvider from '../ServiceWorkerRegistrationProvider/index.js';

const definition = {
  name: 'Test App',
  defaultPage: 'Home',
  notifications: { roles: { Manager: 'login' } },
  security: { default: { role: 'Employee' }, roles: { Employee: {}, Manager: {} } },
  pages: [{ name: 'Home', blocks: [] }],
} as AppDefinition;

function renderPermissionRequest(appMemberRoles: string[]): () => Promise<string> {
  const requestPermission = vi.fn().mockResolvedValue('denied');
  vi.spyOn(appDefinitionProvider, 'useAppDefinition').mockReturnValue({ definition } as never);
  vi.spyOn(appMemberProvider, 'useAppMember').mockReturnValue({
    appMemberInfo: { sub: 'member-id' },
    appMemberRoles,
  } as never);
  vi.spyOn(serviceWorkerRegistrationProvider, 'useServiceWorkerRegistration').mockReturnValue({
    permission: 'default',
    requestPermission,
    subscribe: vi.fn(),
  } as never);
  render(<PermissionRequest />);
  return requestPermission;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PermissionRequest', () => {
  it('should prompt a logged in member whose role uses login', () => {
    expect(renderPermissionRequest(['Manager'])).toHaveBeenCalledWith();
  });

  it('should not prompt a logged in member whose role uses none', () => {
    expect(renderPermissionRequest(['Employee'])).not.toHaveBeenCalled();
  });
});
