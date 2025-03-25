import { normalize } from '@appsemble/utils';

import { App, type Organization } from '../../models/index.js';

export function createDefaultAppWithSecurity(
  org: Organization,
  { name = 'Test App' } = {},
): Promise<App> {
  return App.create({
    definition: {
      name: 'Test App',
      defaultPage: 'Test Page',
      security: {
        default: {
          role: 'Reader',
          policy: 'everyone',
        },
        roles: {
          Reader: {},
          Admin: {},
        },
      },
    },
    path: normalize(name),
    vapidPublicKey: 'a',
    vapidPrivateKey: 'b',
    OrganizationId: org.id,
  });
}
