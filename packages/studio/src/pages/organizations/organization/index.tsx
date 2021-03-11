import { MenuSection, MetaSwitch, useData, useSideMenu } from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { AsyncDataView } from '../../../components/AsyncDataView';
import { MenuItem } from '../../../components/MenuItem';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useUser } from '../../../components/UserProvider';
import { Organization } from '../../../types';
import { checkRole } from '../../../utils/checkRole';
import { IndexPage } from './IndexPage';
import { messages } from './messages';
import { OrganizationMembersPage } from './OrganizationMembersPage';
import { OrganizationSettingsPage } from './OrganizationSettingsPage';

/**
 * Render routes related to apps.
 */
export function OrganizationRoutes(): ReactElement {
  const { path, url } = useRouteMatch();
  const { organizations } = useUser();
  const {
    params: { organizationId },
  } = useRouteMatch<{ organizationId: string }>();
  const id = organizationId.startsWith('@') ? organizationId.slice(1) : organizationId;
  const result = useData<Organization>(`/api/organizations/${id}`);
  const userOrganization = organizations.find((org) => org.id === id);
  const mayEdit = userOrganization && checkRole(userOrganization.role, Permission.EditOrganization);

  useSideMenu(
    result.data && (
      <MenuSection label={<span className="ml-2">{result.data.name}</span>}>
        <MenuItem exact icon="briefcase" to={url}>
          <FormattedMessage {...messages.organization} />
        </MenuItem>
        {userOrganization && (
          <MenuItem exact icon="users" to={`${url}/members`}>
            <FormattedMessage {...messages.members} />
          </MenuItem>
        )}
        {mayEdit && (
          <MenuItem exact icon="cog" to={`${url}/settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        )}
      </MenuSection>
    ),
  );

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.error} />}
      loadingMessage={<FormattedMessage {...messages.loading} />}
      result={result}
    >
      {(organization) => (
        <MetaSwitch
          title={organization.id.startsWith('@') ? organization.id : `@${organization.id}`}
        >
          <Route exact path={path}>
            <IndexPage organization={userOrganization ?? organization} />
          </Route>
          <ProtectedRoute
            exact
            organization={userOrganization}
            path={`${path}/settings`}
            permission={Permission.EditOrganization}
          >
            <OrganizationSettingsPage
              organization={userOrganization ?? organization}
              setOrganization={result.setData}
            />
          </ProtectedRoute>
          <ProtectedRoute exact organization={userOrganization} path={`${path}/members`}>
            <OrganizationMembersPage />
          </ProtectedRoute>
          <Redirect to={path} />
        </MetaSwitch>
      )}
    </AsyncDataView>
  );
}
