import {
  Button,
  CardFooterButton,
  Checkbox,
  Message,
  Modal,
  Select,
  SimpleForm,
  SimpleInput,
  Subtitle,
  Title,
  useData,
  useToggle,
} from '@appsemble/react-components';
import type { Organization } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import useOrganizations from '../../hooks/useOrganizations';
import checkRole from '../../utils/checkRole';
import { useApp } from '../AppContext';
import AppRatings from '../AppRatings';
import styles from './index.css';
import messages from './messages';

export default function AppDetails(): React.ReactElement {
  const { app } = useApp();
  const { data: organization, error, loading } = useData<Organization>(
    `/api/organizations/${app.OrganizationId}`,
  );
  const cloneDialog = useToggle();
  const history = useHistory();
  const { formatMessage } = useIntl();

  const organizations = useOrganizations();

  const cloneApp = React.useCallback(
    async ({ description, name, private: isPrivate, selectedOrganization }) => {
      const { data: clone } = await axios.post('/api/templates', {
        templateId: app.id,
        name,
        description,
        organizationId: organizations[selectedOrganization].id,
        resources: false,
        private: isPrivate,
      });

      history.push(`/apps/${clone.id}/edit`);
    },
    [app, history, organizations],
  );

  const createOrganizations =
    organizations.filter((org) => checkRole(org.role, Permission.CreateApps)) || [];

  return (
    <>
      <div>
        <div className={styles.titleContainer}>
          <header className={`${styles.title} mb-2`}>
            <figure className="image is-96x96 my-0 ml-0 mr-4">
              <img alt={formatMessage(messages.appLogo)} src={`/api/apps/${app.id}/icon`} />
            </figure>
            <div>
              <Title className="is-marginless" level={1}>
                {app.definition.name}
              </Title>
              <Subtitle className="is-marginless" level={3}>
                {loading || error ? `@${app.OrganizationId}` : organization.name}
              </Subtitle>
            </div>
          </header>
          <div>
            {createOrganizations.length ? (
              <Button className="mr-3" onClick={cloneDialog.enable}>
                <FormattedMessage {...messages.clone} />
              </Button>
            ) : null}
            <a
              className="button is-primary"
              href={
                app.domain
                  ? `//${app.domain}${window.location.port && `:${window.location.port}`}`
                  : `//${app.path}.${app.OrganizationId}.${window.location.host}`
              }
              rel="noopener noreferrer"
              target="_blank"
            >
              <FormattedMessage {...messages.view} />
            </a>
          </div>
        </div>
        {app.definition.description && <Message>{app.definition.description}</Message>}
      </div>
      <AppRatings />
      {createOrganizations.length ? (
        <Modal
          component={SimpleForm}
          defaultValues={{
            name: app.definition.name,
            description: app.definition.description,
            private: true,
            selectedOrganization: 0,
          }}
          footer={
            <>
              <CardFooterButton onClick={cloneDialog.disable}>
                <FormattedMessage {...messages.cancel} />
              </CardFooterButton>
              <CardFooterButton color="primary" type="submit">
                <FormattedMessage {...messages.submit} />
              </CardFooterButton>
            </>
          }
          isActive={cloneDialog.enabled}
          onClose={cloneDialog.disable}
          onSubmit={cloneApp}
          title={<FormattedMessage {...messages.clone} />}
        >
          <SimpleInput
            help={<FormattedMessage {...messages.nameDescription} />}
            label={<FormattedMessage {...messages.name} />}
            maxLength={30}
            name="name"
            required
          />
          <SimpleInput<typeof Select>
            component={Select}
            disabled={organizations.length === 1}
            label={<FormattedMessage {...messages.organization} />}
            name="selectedOrganization"
            required
          >
            {organizations.map((org, index) => (
              <option key={org.id} value={index}>
                {org.name ?? org.id}
              </option>
            ))}
          </SimpleInput>
          <SimpleInput
            help={<FormattedMessage {...messages.descriptionDescription} />}
            label={<FormattedMessage {...messages.description} />}
            maxLength={80}
            name="description"
          />
          <SimpleInput<typeof Checkbox>
            component={Checkbox}
            help={<FormattedMessage {...messages.privateDescription} />}
            label={<FormattedMessage {...messages.private} />}
            name="private"
          />
        </Modal>
      ) : null}
    </>
  );
}
