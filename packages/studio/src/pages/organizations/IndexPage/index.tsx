import {
  Button,
  Modal,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { AsyncDataView } from '../../../components/AsyncDataView';
import { CollapsibleList } from '../../../components/CollapsibleList';
import { HeaderControl } from '../../../components/HeaderControl';
import { ListButton } from '../../../components/ListButton';
import { useUser } from '../../../components/UserProvider';
import { messages } from './messages';

function calculateOrganizationId(
  name: string,
  newValues: Organization,
  oldValues: Organization,
): Organization {
  if (name !== 'name') {
    return newValues;
  }
  if (normalize(oldValues.name) === oldValues.id) {
    return {
      ...newValues,
      id: normalize(newValues.name).slice(0, 30).replace(/-+$/, ''),
    };
  }
  return newValues;
}

const newOrganization = {
  id: '',
  name: '',
  description: '',
  website: '',
  email: '',
};

export function IndexPage(): ReactElement {
  const result = useData<Organization[]>('/api/organizations');
  const { organizations, setOrganizations, userInfo } = useUser();
  const { url } = useRouteMatch();
  const history = useHistory();
  const modal = useToggle();
  const { formatMessage } = useIntl();

  const submitOrganization = useCallback(
    async ({ description, email, id, name, website }: Organization) => {
      const { data } = await axios.post<Organization>('/api/organizations', {
        name,
        id: normalize(id),
        description,
        email,
        website,
      });
      setOrganizations([...organizations, { ...data, role: 'Owner' }]);
      modal.disable();
      history.push(`${url}/${id}`);
    },
    [modal, organizations, setOrganizations, history, url],
  );

  return (
    <>
      <HeaderControl
        control={
          userInfo && (
            <Button onClick={modal.enable}>
              <FormattedMessage {...messages.createButton} />
            </Button>
          )
        }
        level={1}
      >
        <FormattedMessage {...messages.title} />
      </HeaderControl>
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
                    to={`${url}/@${organization.id}`}
                  />
                ))}
              </ul>
            ) : (
              <FormattedMessage {...messages.noOrganizations} />
            )}
          </CollapsibleList>
        )}
      </AsyncDataView>
      {userInfo.email_verified && (
        <Modal
          component={SimpleForm}
          defaultValues={newOrganization}
          footer={
            <SimpleModalFooter
              cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
              onClose={modal.disable}
              submitLabel={<FormattedMessage {...messages.createButton} />}
            />
          }
          isActive={modal.enabled}
          onClose={modal.disable}
          onSubmit={submitOrganization}
          preprocess={calculateOrganizationId}
          resetOnSuccess
        >
          <SimpleFormField
            icon="briefcase"
            label={<FormattedMessage {...messages.organizationName} />}
            name="name"
          />
          <SimpleFormField
            icon="at"
            label={<FormattedMessage {...messages.organizationId} />}
            maxLength={30}
            name="id"
            preprocess={(value) => normalize(value, false)}
            required
          />
          <SimpleFormField
            icon="globe"
            label={<FormattedMessage {...messages.website} />}
            name="website"
            type="url"
          />
          <SimpleFormField
            icon="envelope"
            label={<FormattedMessage {...messages.email} />}
            name="email"
            type="email"
          />
          <SimpleFormField
            icon="info"
            label={<FormattedMessage {...messages.description} />}
            name="description"
          />
        </Modal>
      )}
    </>
  );
}
