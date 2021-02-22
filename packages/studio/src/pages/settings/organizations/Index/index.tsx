import {
  Button,
  Content,
  Modal,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import { HeaderControl } from '../../../../components/HeaderControl';
import { ListButton } from '../../../../components/ListButton';
import { useUser } from '../../../../components/UserProvider';
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
};

/**
 * Render a list of organizations.
 *
 * The rendered list items are links to the organization settings page.
 */
export function IndexPage(): ReactElement {
  useMeta(messages.title);
  const { organizations, setOrganizations, userInfo } = useUser();
  const { url } = useRouteMatch();
  const modal = useToggle();
  const { formatMessage } = useIntl();

  const submitOrganization = useCallback(
    async ({ id, name }: Organization) => {
      const { data } = await axios.post<Organization>('/api/organizations', {
        name,
        id: normalize(id),
      });
      setOrganizations([...organizations, { ...data, role: 'Owner' }]);
      modal.disable();
    },
    [modal, organizations, setOrganizations],
  );

  return (
    <Content fullwidth main>
      <HeaderControl
        control={
          <Button disabled={!userInfo.email_verified} onClick={modal.enable}>
            <FormattedMessage {...messages.createButton} />
          </Button>
        }
        level={1}
      >
        <FormattedMessage {...messages.title} />
      </HeaderControl>
      <ul>
        {organizations.map((org) => (
          <ListButton
            alt={formatMessage(messages.logo)}
            image={org.iconUrl}
            key={org.id}
            subtitle={org.role}
            title={org.name || `@${org.id}`}
            to={`${url}/${org.id}/members`}
          />
        ))}
      </ul>
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
          disabled={!userInfo.email_verified}
          icon="briefcase"
          label={<FormattedMessage {...messages.organizationName} />}
          name="name"
        />
        <SimpleFormField
          disabled={!userInfo.email_verified}
          icon="at"
          label={<FormattedMessage {...messages.organizationId} />}
          maxLength={30}
          name="id"
          preprocess={(value) => normalize(value, false)}
          required
        />
      </Modal>
    </Content>
  );
}
