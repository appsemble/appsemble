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
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import checkRole from '../../utils/checkRole';
import getAppUrl from '../../utils/getAppUrl';
import { useApp } from '../AppContext';
import AppRatings from '../AppRatings';
import { useOrganizations } from '../OrganizationsProvider';
import styles from './index.css';
import messages from './messages';

export default function AppDetails(): ReactElement {
  const { app } = useApp();
  const { data: organization, error, loading } = useData<Organization>(
    `/api/organizations/${app.OrganizationId}`,
  );
  const cloneDialog = useToggle();
  const history = useHistory();
  const { formatMessage } = useIntl();

  const organizations = useOrganizations();

  const cloneApp = useCallback(
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
              href={getAppUrl(app.OrganizationId, app.path, app.domain)}
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
            resources: false,
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
          {app.resources && (
            <SimpleInput<typeof Checkbox>
              component={Checkbox}
              help={<FormattedMessage {...messages.resourcesDescription} />}
              label={<FormattedMessage {...messages.resources} />}
              name="resources"
            />
          )}
        </Modal>
      ) : null}
    </>
  );
}
