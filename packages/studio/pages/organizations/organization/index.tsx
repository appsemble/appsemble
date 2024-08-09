import {
  MenuItem,
  MenuSection,
  MetaSwitch,
  useData,
  useSideMenu,
} from '@appsemble/react-components';
import { OrganizationPermission } from '@appsemble/types';
import {
  checkOrganizationRoleOrganizationPermissions,
  normalize,
  normalized,
} from '@appsemble/utils';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import { CollectionsPage } from './CollectionsPage/index.js';
import { IndexPage } from './IndexPage/index.js';
import { MembersPage } from './MembersPage/index.js';
import { messages } from './messages.js';
import { SettingsPage } from './SettingsPage/index.js';
import { AsyncDataView } from '../../../components/AsyncDataView/index.js';
import { ProtectedRoute } from '../../../components/ProtectedRoute/index.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { type Organization } from '../../../types.js';

/**
 * Render routes related to apps.
 */
export function OrganizationRoutes(): ReactNode {
  const { organizations } = useUser();
  const { organizationId } = useParams<{ organizationId: string }>();
  const url = `organizations/${organizationId}`;

  const result = useData<Organization>(`/api/organizations/${organizationId}`);
  const userOrganization = organizations?.find((org) => org.id === organizationId);
  const mayEdit =
    userOrganization &&
    checkOrganizationRoleOrganizationPermissions(userOrganization.role, [
      OrganizationPermission.UpdateOrganizations,
    ]);

  useSideMenu(
    result.data && (
      <MenuSection label={<span className="ml-2">{result.data.name}</span>}>
        <MenuItem end icon="briefcase" to={url}>
          <FormattedMessage {...messages.organization} />
        </MenuItem>
        {userOrganization ? (
          <MenuItem end icon="users" to={`${url}/members`}>
            <FormattedMessage {...messages.members} />
          </MenuItem>
        ) : null}
        {userOrganization ? (
          <MenuItem end icon="folder" to={`${url}/collections`}>
            <FormattedMessage {...messages.collections} />
          </MenuItem>
        ) : null}
        {mayEdit ? (
          <MenuItem end icon="cog" to={`${url}/settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        ) : null}
      </MenuSection>
    ),
  );

  if (!normalized.test(organizationId)) {
    return <Navigate to={String(url.replace(organizationId, normalize(organizationId)))} />;
  }

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.error} />}
      loadingMessage={<FormattedMessage {...messages.loading} />}
      result={result}
    >
      {(organization) => (
        <MetaSwitch title={organization.name || organizationId}>
          <Route element={<IndexPage organization={userOrganization ?? organization} />} path="/" />

          <Route
            element={
              <ProtectedRoute
                organization={userOrganization}
                permissions={[OrganizationPermission.UpdateOrganizations]}
              />
            }
          >
            <Route
              element={
                <SettingsPage
                  onChangeOrganization={result.setData}
                  organization={userOrganization ?? organization}
                />
              }
              path="/settings"
            />
          </Route>

          {userOrganization ? (
            <Route element={<ProtectedRoute organization={userOrganization} />}>
              <Route
                element={<CollectionsPage organizationId={organizationId} />}
                path="/collections"
              />
            </Route>
          ) : null}

          {userOrganization ? (
            <Route element={<ProtectedRoute organization={userOrganization} />}>
              <Route element={<MembersPage />} path="/members" />
            </Route>
          ) : null}

          <Route element={<Navigate to={url} />} path="*" />
        </MetaSwitch>
      )}
    </AsyncDataView>
  );
}
