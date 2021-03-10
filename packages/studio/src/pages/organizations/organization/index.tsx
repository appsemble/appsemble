import { MetaSwitch, useData } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

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
  const {
    params: { organizationId },
  } = useRouteMatch<{ organizationId: string }>();

  const result = useData<Organization>(
    `/api/organizations/${
      organizationId.startsWith('@') ? organizationId.slice(1) : organizationId
    }`,
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
            <IndexPage organization={organization} />
          </Route>
          <Route exact path={`${path}/settings`}>
            <OrganizationSettingsPage
              organization={organization}
              setOrganization={result.setData}
            />
          </Route>
          <Route exact path={`${path}/members`}>
            <OrganizationMembersPage />
          </Route>
          <Redirect to={path} />
        </MetaSwitch>
      )}
    </AsyncDataView>
  );
}
