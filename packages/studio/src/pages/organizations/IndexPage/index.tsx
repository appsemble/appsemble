import { Title } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';
import { ListButton } from 'studio/src/components/ListButton';

import { useUser } from '../../../components/UserProvider';
import { messages } from './messages';

export function IndexPage(): ReactElement {
  // Const result = useData<Organization[]>('/api/apps/organizations');
  const { organizations } = useUser();
  const { url } = useRouteMatch();
  const { formatMessage } = useIntl();

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      {/* <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.empty} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(organizations) => ( */}
      <ul>
        {organizations.map((organization) => (
          <ListButton
            alt={formatMessage(messages.logo)}
            description={organization.role}
            image={organization.iconUrl}
            key={organization.id}
            subtitle={`@${organization.id}`}
            title={organization.name || organization.id}
            to={`${url}/${organization.id}`}
          />
        ))}
      </ul>
      {/* )}
      </AsyncDataView> */}
    </>
  );
}
