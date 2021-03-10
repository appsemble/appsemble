import { Button } from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';
import { CardHeaderControl } from 'studio/src/components/CardHeaderControl';

import { useUser } from '../../../../components/UserProvider';
import { Organization } from '../../../../types';
import { checkRole } from '../../../../utils/checkRole';
import { messages } from './messages';

interface IndexPageProps {
  organization: Organization;
}

export function IndexPage({ organization }: IndexPageProps): ReactElement {
  const { url } = useRouteMatch();
  const { formatMessage } = useIntl();
  const { organizations } = useUser();

  const userOrganization = organizations?.find((org) => org.id === organization.id);
  const mayEditOrganization =
    userOrganization && checkRole(userOrganization.role, Permission.EditOrganization);
  const id = organization.id.startsWith('@') ? organization.id : `@${organization.id}`;

  return (
    <div>
      <CardHeaderControl
        controls={
          <>
            {mayEditOrganization && (
              <Button className="mb-3 ml-4" component={Link} to={`${url}/settings`}>
                <FormattedMessage {...messages.editOrganization} />
              </Button>
            )}
            {userOrganization && (
              <Button className="mb-3 ml-4" component={Link} to={`${url}/members`}>
                <FormattedMessage {...messages.viewMembers} />
              </Button>
            )}
          </>
        }
        description="The organization’s description"
        icon={
          <img
            alt={formatMessage(messages.logo)}
            className="px-4 py-4 card"
            src={organization.iconUrl}
          />
        }
        subtitle={id}
        title={organization.name || id}
      />
    </div>
  );
}
