import {
  Button,
  Content,
  Modal,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Subtitle,
  Title,
  useToggle,
} from '@appsemble/react-components';
import type { Organization } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useRouteMatch } from 'react-router-dom';

import { HeaderControl } from '../HeaderControl';
import { HelmetIntl } from '../HelmetIntl';
import { useUser } from '../UserProvider';
import styles from './index.css';
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
export function OrganizationsList(): ReactElement {
  const { organizations, setOrganizations, userInfo } = useUser();
  const { url } = useRouteMatch();
  const modal = useToggle();

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
    <Content fullwidth main padding>
      <HelmetIntl title={messages.title} />
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
          <li className={`my-4 ${styles.listItem}`} key={org.id}>
            <Link className={`px-4 py-4 ${styles.link}`} to={`${url}/${org.id}`}>
              <Title level={3}>{org.name || `@${org.id}`}</Title>
              <Subtitle level={5}>{org.role}</Subtitle>
            </Link>
          </li>
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
