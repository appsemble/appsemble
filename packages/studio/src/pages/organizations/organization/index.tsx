import { Button, useData, useMeta } from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';
import { CardHeaderControl } from 'studio/src/components/CardHeaderControl';

import { AsyncDataView } from '../../../components/AsyncDataView';
import { useUser } from '../../../components/UserProvider';
import { Organization } from '../../../types';
import { checkRole } from '../../../utils/checkRole';
import { messages } from './messages';

export function OrganizationPage(): ReactElement {
  const {
    params: { id },
    url,
  } = useRouteMatch<{ id: string }>();
  const { formatMessage } = useIntl();
  const { organizations } = useUser();

  const result = useData<Organization>(
    `/api/organizations/${id.startsWith('@') ? id.slice(1) : id}`,
  );

  const title = result.loading || result.error ? `@${id}` : result.data?.name;
  useMeta(title);
  const userOrganization = organizations?.find((org) => org.id === result.data?.id);
  const mayEditOrganization =
    userOrganization && checkRole(userOrganization.role, Permission.EditOrganization);

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.error} />}
      loadingMessage={<FormattedMessage {...messages.loading} />}
      result={result}
    >
      {(organization) => (
        <div>
          <CardHeaderControl
            controls={
              mayEditOrganization && (
                <Button
                  className="mb-3 ml-4"
                  color="primary"
                  component={Link}
                  to={`${url}/settings`}
                >
                  <FormattedMessage {...messages.logo} />
                </Button>
              )
            }
            description="The organization’s description"
            icon={
              <img
                alt={formatMessage(messages.logo)}
                className="px-4 py-4 card"
                src={organization.iconUrl}
              />
            }
            subtitle={id.startsWith('@') ? id : `@${id}`}
            title={title}
          />
        </div>
      )}
    </AsyncDataView>
  );
}
