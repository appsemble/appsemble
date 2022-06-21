import {
  MenuItem,
  MenuSection,
  MetaSwitch,
  useData,
  useSideMenu,
} from '@appsemble/react-components';
import { normalize, normalized, Permission } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { AsyncDataView } from '../../../components/AsyncDataView';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useUser } from '../../../components/UserProvider';
import { Organization } from '../../../types';
import { checkRole } from '../../../utils/checkRole';
import { IndexPage } from './IndexPage';
import { MembersPage } from './MembersPage';
import { messages } from './messages';
import { SettingsPage } from './SettingsPage';

/**
 * Render routes related to apps.
 */
export function OrganizationRoutes(): ReactElement {
  const { path, url } = useRouteMatch();
  const { organizations } = useUser();
  const {
    params: { organizationId },
  } = useRouteMatch<{ organizationId: string }>();
  const result = useData<Organization>(`/api/organizations/${organizationId}`);
  const userOrganization = organizations?.find((org) => org.id === organizationId);
  const mayEdit = userOrganization && checkRole(userOrganization.role, Permission.EditOrganization);

  useSideMenu(
    result.data && (
      <MenuSection label={<span className="ml-2">{result.data.name}</span>}>
        <MenuItem exact icon="briefcase" to={url}>
          <FormattedMessage {...messages.organization} />
        </MenuItem>
        {userOrganization ? (
          <MenuItem exact icon="users" to={`${url}/members`}>
            <FormattedMessage {...messages.members} />
          </MenuItem>
        ) : null}
        {mayEdit ? (
          <MenuItem exact icon="cog" to={`${url}/settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        ) : null}
      </MenuSection>
    ),
  );

  if (!normalized.test(organizationId)) {
    return <Redirect to={String(url.replace(organizationId, normalize(organizationId)))} />;
  }

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.error} />}
      loadingMessage={<FormattedMessage {...messages.loading} />}
      result={result}
    >
      {(organization) => (
        <MetaSwitch title={organization.name || organizationId}>
          <Route exact path={path}>
            <IndexPage organization={userOrganization ?? organization} />
          </Route>
          <ProtectedRoute
            exact
            organization={userOrganization}
            path={`${path}/settings`}
            permission={Permission.EditOrganization}
          >
            <SettingsPage
              onChangeOrganization={result.setData}
              organization={userOrganization ?? organization}
            />
          </ProtectedRoute>
          {userOrganization ? (
            <ProtectedRoute exact organization={userOrganization} path={`${path}/members`}>
              <MembersPage />
            </ProtectedRoute>
          ) : null}
          <Redirect to={path} />
        </MetaSwitch>
      )}
    </AsyncDataView>
  );
}
