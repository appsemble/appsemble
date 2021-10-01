import {
  Button,
  CheckboxField,
  Message,
  ModalCard,
  SelectField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  useData,
  useToggle,
} from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import axios, { AxiosError } from 'axios';
import { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { useUser } from '../../../../components/UserProvider';
import { checkRole } from '../../../../utils/checkRole';
import { messages } from './messages';

interface Template {
  id: number;
  name: string;
  description: string;
  resources: boolean;
}

export function CreateAppButton({ className }: { className: string }): ReactElement {
  const modal = useToggle();
  const { data: templates } = useData<Template[]>('/api/templates');
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const history = useHistory();
  const { url } = useRouteMatch();
  const { organizations } = useUser();

  const onCreate = useCallback(
    async ({ description, includeResources, isPrivate, name, selectedOrganization }) => {
      const { id, resources } = templates[selectedTemplate];

      const { data } = await axios.post('/api/templates', {
        templateId: id,
        name,
        description,
        organizationId: organizations[selectedOrganization].id,
        resources: resources && includeResources,
        private: isPrivate,
      });
      history.push(`${url}/${data.id}/edit`);
    },
    [history, url, organizations, selectedTemplate, templates],
  );

  const createOrganizations = organizations.filter((org) =>
    checkRole(org.role, Permission.CreateApps),
  );

  if (!templates?.length) {
    return null;
  }

  return (
    <>
      <Button className={className} onClick={modal.enable}>
        <FormattedMessage {...messages.createApp} />
      </Button>
      <ModalCard
        component={SimpleForm}
        defaultValues={{
          name: '',
          description: '',
          resources: false,
          isPrivate: true,
          includeResources: templates[selectedTemplate].resources,
          selectedOrganization: 0,
        }}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancel} />}
            onClose={modal.disable}
            submitLabel={<FormattedMessage {...messages.create} />}
          />
        }
        isActive={modal.enabled}
        onClose={modal.disable}
        onSubmit={onCreate}
        title={<FormattedMessage {...messages.createApp} />}
      >
        <SimpleFormError>
          {({ error }) =>
            (error as AxiosError)?.response?.status === 409 ? (
              <FormattedMessage {...messages.nameConflict} />
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
          disabled={createOrganizations.length === 1}
          label={<FormattedMessage {...messages.organization} />}
          name="selectedOrganization"
          required
        >
          {createOrganizations.map((organization, index) => (
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
          component={CheckboxField}
          label={<FormattedMessage {...messages.private} />}
          name="isPrivate"
          title={<FormattedMessage {...messages.privateHelp} />}
        />
        {templates[selectedTemplate].resources && (
          <SimpleFormField
            component={CheckboxField}
            label={<FormattedMessage {...messages.resources} />}
            name="includeResources"
            title={<FormattedMessage {...messages.includeResources} />}
          />
        )}
      </ModalCard>
    </>
  );
}
