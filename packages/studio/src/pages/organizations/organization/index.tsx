import { MetaSwitch, useData } from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';
import { ProtectedRoute } from 'studio/src/components/ProtectedRoute';
import { useUser } from 'studio/src/components/UserProvider';

import { AsyncDataView } from '../../../components/AsyncDataView';
import { Organization } from '../../../types';
import { IndexPage } from './IndexPage';
import { messages } from './messages';
import { OrganizationMembersPage } from './OrganizationMembersPage';
import { OrganizationSettingsPage } from './OrganizationSettingsPage';

/**
 * Render routes related to apps.
 */
export function OrganizationRoutes(): ReactElement {
  const { path } = useRouteMatch();
  const { organizations } = useUser();
  const {
    params: { organizationId },
  } = useRouteMatch<{ organizationId: string }>();
  const id = organizationId.startsWith('@') ? organizationId.slice(1) : organizationId;

  const result = useData<Organization>(`/api/organizations/${id}`);

  const userOrganization = organizations.find((org) => org.id === id);

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
