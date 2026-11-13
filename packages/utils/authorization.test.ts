import { OrganizationPermission, PredefinedOrganizationRole } from '@appsemble/types';
import { describe, expect, it } from 'vitest';

import { checkOrganizationRoleOrganizationPermissions } from './authorization.js';

describe('organization permissions', () => {
  it('combines permissions granted by separate organization roles', () => {
    expect(
      checkOrganizationRoleOrganizationPermissions(
        [PredefinedOrganizationRole.AppTranslator, PredefinedOrganizationRole.AppMemberManager],
        [OrganizationPermission.CreateAppMessages, OrganizationPermission.CreateAppInvites],
      ),
    ).toBe(true);
  });

  it('denies permissions when no role grants access', () => {
    expect(
      checkOrganizationRoleOrganizationPermissions([], [OrganizationPermission.QueryApps]),
    ).toBe(false);
  });
});
