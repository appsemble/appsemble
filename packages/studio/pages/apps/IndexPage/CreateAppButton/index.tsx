import {
  Button,
  CheckboxField,
  Message,
  ModalCard,
  NavLink,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  useData,
} from '@appsemble/react-components';
import { type App, OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation, useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { CreateOrganizationModal } from '../../../../components/CreateOrganizationModal/index.js';
import { ResendEmailButton } from '../../../../components/ResendEmailButton/index.js';
import { useUser } from '../../../../components/UserProvider/index.js';

interface Template {
  id: number;
  name: string;
  description: string;
  resources: boolean;
}

export function CreateAppButton({ className }: { readonly className?: string }): ReactNode {
  const { data: templates } = useData<Template[]>('/api/app-templates');
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const navigate = useNavigate();
  const { hash } = useLocation();
  const { formatMessage } = useIntl();
  const { organizations, userInfo } = useUser();

  const organizationIndex = organizations?.findIndex((org) =>
    checkOrganizationRoleOrganizationPermissions(org.role, [OrganizationPermission.CreateApps]),
  );

  const createOrganizations = organizations?.filter((org) =>
    checkOrganizationRoleOrganizationPermissions(org.role, [OrganizationPermission.CreateApps]),
  );

  const defaultValues = {
    name: '',
    description: '',
    resources: false,
    visibility: 'unlisted',
    includeResources: Boolean(templates?.[selectedTemplate]?.resources),
    selectedOrganization: organizationIndex,
  };

  const onCreate = useCallback(
    async ({
      description,
      includeResources,
      name,
      selectedOrganization,
      visibility,
    }: typeof defaultValues) => {
      const { id, resources } = templates[selectedTemplate];

      const { data } = await axios.post<App>('/api/app-templates', {
        templateId: id,
        name,
        description,
        organizationId: createOrganizations[selectedOrganization].id,
        resources: resources && includeResources,
        visibility,
      });
      navigate(`${data.id}/edit#editor`);
    },
    [createOrganizations, navigate, selectedTemplate, templates],
  );

  const openCreateDialog = useCallback(() => {
    navigate({ hash: 'create' }, { replace: true });
  }, [navigate]);

  const closeCreateDialog = useCallback(() => {
    navigate({ hash: null }, { replace: true });
  }, [navigate]);

  const active = hash === '#create';

  if (!templates?.length) {
    return null;
  }

  return (
    <>
      <Button className={className} onClick={openCreateDialog}>
        <FormattedMessage {...messages.createApp} />
      </Button>
      {createOrganizations?.length ? (
        <ModalCard
          component={SimpleForm}
          defaultValues={defaultValues}
          footer={
            <SimpleModalFooter
              cancelLabel={<FormattedMessage {...messages.cancel} />}
              onClose={closeCreateDialog}
              submitLabel={<FormattedMessage {...messages.create} />}
            />
          }
          isActive={active}
          onClose={closeCreateDialog}
          onSubmit={onCreate}
          title={<FormattedMessage {...messages.createApp} />}
        >
          <SimpleFormError>
            {({ error }) =>
              axios.isAxiosError(error) && error.response?.status === 403 ? (
                <FormattedMessage {...messages.createFailAppLimit} />
              ) : (
                <FormattedMessage {...messages.error} />
              )
            }
          </SimpleFormError>
          <SimpleFormField
            label={<FormattedMessage {...messages.name} />}
            maxLength={30}
            minLength={1}
            name="name"
            required
          />
          <SimpleFormField
            component={SelectField}
            disabled={createOrganizations?.length === 1}
            label={<FormattedMessage {...messages.organization} />}
            name="selectedOrganization"
            required
          >
            {createOrganizations?.map((organization, index) => (
              <option key={organization.id} value={index}>
                {organization.id}
              </option>
            ))}
          </SimpleFormField>
          <SimpleFormField
            label={<FormattedMessage {...messages.description} />}
            maxLength={80}
            name="description"
          />
          <SimpleFormField
            component={SelectField}
            help={
              <div>
                Want to start off from a different app? You can also{' '}
                <NavLink to="/docs/studio/app-store#cloning-an-app">clone an app</NavLink> directly
                from the app store
              </div>
            }
            label={<FormattedMessage {...messages.template} />}
            name="selectedTemplate"
            onChange={({ currentTarget }) => setSelectedTemplate(currentTarget.value)}
            required
          >
            {templates.map((template, index) => (
              <option key={template.name} value={index}>
                {template.name}
              </option>
            ))}
          </SimpleFormField>
          <Message>{templates[selectedTemplate].description}</Message>
          <SimpleFormField
            component={SelectField}
            help={<FormattedMessage {...messages.visibilityDescription} />}
            label={<FormattedMessage {...messages.visibilityLabel} />}
            name="visibility"
          >
            <option value="public">{formatMessage(messages.public)}</option>
            <option value="unlisted">{formatMessage(messages.unlisted)}</option>
            <option value="private">{formatMessage(messages.private)}</option>
          </SimpleFormField>
          {templates[selectedTemplate].resources ? (
            <SimpleFormField
              component={CheckboxField}
              label={<FormattedMessage {...messages.resources} />}
              name="includeResources"
              title={<FormattedMessage {...messages.includeResources} />}
            />
          ) : null}
        </ModalCard>
      ) : (
        <CreateOrganizationModal
          disabled={!userInfo.email_verified}
          help={
            <div className="mb-4">
              <span>
                <FormattedMessage {...messages.createOrganizationInstructions} />
              </span>
              {userInfo.email_verified ? null : (
                <div className="is-flex is-flex-direction-column is-align-items-center">
                  <span className="my-2">
                    <FormattedMessage {...messages.createVerifyMessage} />
                  </span>
                  <ResendEmailButton className="is-outlined" email={userInfo.email} />
                </div>
              )}
            </div>
          }
          isActive={active}
          onClose={closeCreateDialog}
          title={<FormattedMessage {...messages.createApp} />}
        />
      )}
    </>
  );
}
