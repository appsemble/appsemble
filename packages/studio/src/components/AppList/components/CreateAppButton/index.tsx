import {
  Button,
  CardFooterButton,
  Checkbox,
  Message,
  Modal,
  Select,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  useData,
  useToggle,
} from '@appsemble/react-components';
import axios, { AxiosError } from 'axios';
import React, { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { useUser } from '../../../UserProvider';
import messages from './messages';

interface Template {
  id: number;
  name: string;
  description: string;
  resources: boolean;
}

export default function CreateAppButton({ className }: { className: string }): ReactElement {
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

  if (!templates?.length) {
    return null;
  }

  return (
    <>
      <Button className={className} onClick={modal.enable}>
        <FormattedMessage {...messages.createApp} />
      </Button>
      <Modal
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
          <>
            <CardFooterButton onClick={modal.disable}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="primary" type="submit">
              <FormattedMessage {...messages.create} />
            </CardFooterButton>
          </>
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
        <SimpleInput
          label={<FormattedMessage {...messages.name} />}
          maxLength={30}
          minLength={1}
          name="name"
          required
        />
        <SimpleInput
          component={Select}
          disabled={organizations?.length === 1}
          label={<FormattedMessage {...messages.organization} />}
          name="selectedOrganization"
          required
        >
          {organizations?.map((organization, index) => (
            <option key={organization.id} value={index}>
              {organization.id}
            </option>
          ))}
        </SimpleInput>
        <SimpleInput
          label={<FormattedMessage {...messages.description} />}
          maxLength={80}
          name="description"
        />
        <SimpleInput
          component={Select}
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
        </SimpleInput>
        <Message>{templates[selectedTemplate].description}</Message>
        <SimpleInput
          component={Checkbox}
          help={<FormattedMessage {...messages.privateHelp} />}
          label={<FormattedMessage {...messages.private} />}
          name="isPrivate"
        />
        {templates[selectedTemplate].resources && (
          <SimpleInput
            component={Checkbox}
            help={<FormattedMessage {...messages.includeResources} />}
            label={<FormattedMessage {...messages.resources} />}
            name="includeResources"
          />
        )}
      </Modal>
    </>
  );
}
