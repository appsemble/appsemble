import { Title, useData } from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';
import { AsyncDataView } from 'studio/src/components/AsyncDataView';

import { CollapsibleList } from '../../../components/CollapsibleList';
import { ListButton } from '../../../components/ListButton';
import { useUser } from '../../../components/UserProvider';
import { messages } from './messages';

export function IndexPage(): ReactElement {
  const result = useData<Organization[]>('/api/organizations');
  const { organizations } = useUser();
  const { url } = useRouteMatch();
  const { formatMessage } = useIntl();

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      {organizations?.length ? (
        <CollapsibleList title={<FormattedMessage {...messages.myOrganizations} />}>
          <ul>
            {organizations.map((organization) => (
              <ListButton
                alt={formatMessage(messages.logo)}
                description={organization.role}
                image={organization.iconUrl}
                key={organization.id}
                subtitle={`@${organization.id}`}
                title={organization.name || organization.id}
                to={`${url}/@${organization.id}`}
              />
            ))}
          </ul>
        </CollapsibleList>
      ) : null}

      <AsyncDataView
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(allOrganizations) => (
          <CollapsibleList title={<FormattedMessage {...messages.allOrganizations} />}>
            {allOrganizations?.length ? (
              <ul>
                {allOrganizations.map((organization) => (
                  <ListButton
                    alt={formatMessage(messages.logo)}
                    image={organization.iconUrl}
                    key={organization.id}
                    subtitle={`@${organization.id}`}
                    title={organization.name || organization.id}
                    to={`${url}/${organization.id}`}
                  />
                ))}
              </ul>
            ) : (
              <FormattedMessage {...messages.noOrganizations} />
            )}
          </CollapsibleList>
        )}
      </AsyncDataView>
    </>
  );
}
