import { Button, useData, useToggle } from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { AsyncDataView } from '../../../components/AsyncDataView';
import { Collapsible } from '../../../components/Collapsible';
import { CreateOrganizationModal } from '../../../components/CreateOrganizationModal';
import { HeaderControl } from '../../../components/HeaderControl';
import { ListButton } from '../../../components/ListButton';
import { useUser } from '../../../components/UserProvider';
import { messages } from './messages';

export function IndexPage(): ReactElement {
  const result = useData<Organization[]>('/api/organizations');
  const { organizations, userInfo } = useUser();
  const { url } = useRouteMatch();
  const history = useHistory();
  const modal = useToggle();
  const { formatMessage } = useIntl();

  const onSubmitOrganization = useCallback(
    ({ id }: Organization) => {
      history.push(`${url}/${id}`);
    },
    [history, url],
  );

  return (
    <>
      <HeaderControl
        control={
          userInfo ? (
            <Button
              disabled={!userInfo?.email_verified}
              onClick={modal.enable}
              title={userInfo?.email_verified ? null : formatMessage(messages.createVerify)}
            >
              <FormattedMessage {...messages.createButton} />
            </Button>
          ) : null
        }
        level={1}
      >
        <FormattedMessage {...messages.title} />
      </HeaderControl>
      {organizations?.length ? (
        <Collapsible title={<FormattedMessage {...messages.myOrganizations} />}>
          <ul>
            {organizations.map((organization) => (
              <ListButton
                alt={formatMessage(messages.logo)}
                description={organization.role}
                icon="building"
                image={organization.iconUrl}
                key={organization.id}
                subtitle={organization.id}
                title={organization.name || organization.id}
                to={`${url}/${organization.id}`}
              />
            ))}
          </ul>
        </Collapsible>
      ) : null}
      <Collapsible title={<FormattedMessage {...messages.allOrganizations} />}>
        <AsyncDataView
          emptyMessage={<FormattedMessage {...messages.noOrganizations} />}
          errorMessage={<FormattedMessage {...messages.error} />}
          loadingMessage={<FormattedMessage {...messages.loading} />}
          result={result}
        >
          {(allOrganizations) => (
            <ul>
              {allOrganizations.map((organization) => (
                <ListButton
                  alt={formatMessage(messages.logo)}
                  icon="building"
                  image={organization.iconUrl}
                  key={organization.id}
                  subtitle={organization.id}
                  title={organization.name || organization.id}
                  to={`${url}/${organization.id}`}
                />
              ))}
            </ul>
          )}
        </AsyncDataView>
      </Collapsible>
      {userInfo?.email_verified ? (
        <CreateOrganizationModal
          isActive={modal.enabled}
          onClose={modal.disable}
          onCreateOrganization={onSubmitOrganization}
          title={<FormattedMessage {...messages.createTitle} />}
        />
      ) : null}
    </>
  );
}
