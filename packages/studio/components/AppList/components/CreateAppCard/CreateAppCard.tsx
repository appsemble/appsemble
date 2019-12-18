import {
  CardFooterButton,
  Checkbox,
  Modal,
  Select,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
} from '@appsemble/react-components';
import { App, Message, Organization } from '@appsemble/types';
import axios from 'axios';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';

import styles from './CreateAppCard.css';
import messages from './messages';

interface Template {
  id: number;
  name: string;
  description: string;
  resources: boolean;
}

interface CreateAppCardProps {
  createTemplateApp: (
    template: {
      templateId: number;
      name: string;
      description: string;
      isPrivate: boolean;
      resources: boolean;
    },
    organization: { id: string },
  ) => Promise<App>;
  organizations: Organization[];
  push: (message: Message) => void;
}

export default function CreateAppCard({
  createTemplateApp,
  organizations,
}: CreateAppCardProps): JSX.Element {
  const history = useHistory();
  const match = useRouteMatch();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [templates, setTemplates] = React.useState<Template[]>(null);
  const [selectedTemplate, setSelectedTemplate] = React.useState(0);

  const closeModal = React.useCallback(() => {
    setModalOpen(false);
  }, []);

  const openModal = React.useCallback(() => {
    setModalOpen(true);
  }, []);

  const onCreate = React.useCallback(
    async ({ name, description, selectedOrganization, includeResources, isPrivate }) => {
      const { id, resources } = templates[selectedTemplate];
      const app = await createTemplateApp(
        {
          templateId: id,
          name,
          isPrivate,
          description,
          resources: resources && includeResources,
        },
        organizations[selectedOrganization],
      );

      history.push(`${match.url}/${app.id}/edit`);
    },
    [createTemplateApp, history, match.url, organizations, selectedTemplate, templates],
  );

  React.useEffect(() => {
    axios.get('/api/templates').then(({ data }) => {
      setTemplates(data);
    });
  }, []);

  const onKeyDown = (event: React.KeyboardEvent): void => {
    if (event.key === 'Escape') {
      setModalOpen(false);
    }
  };

  if (!templates?.length) {
    return null;
  }

  return (
    <div className={styles.createAppCardContainer}>
      <div
        className={classNames('card', styles.createAppCard)}
        onClick={openModal}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="card-content">
          <FormattedMessage {...messages.createApp} />
        </div>
      </div>
      <Modal
        component={SimpleForm}
        defaultValues={{
          name: '',
          description: '',
          resources: false,
          isPrivate: true,
          includeResources: templates[selectedTemplate].resources,
        }}
        footer={
          <>
            <CardFooterButton onClick={closeModal}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton type="submit">
              <FormattedMessage {...messages.create} />
            </CardFooterButton>
          </>
        }
        isActive={modalOpen}
        onClose={closeModal}
        onSubmit={onCreate}
        title={<FormattedMessage {...messages.createAppTitle} />}
      >
        <SimpleFormError>
          {({ error }) =>
            // @ts-ignore: Property 'response' does not exist on type 'Error'.
            error?.response?.status === 409 ? (
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
          name="appName"
          required
        />
        <SimpleInput
          component={Select}
          disabled={organizations.length === 1}
          label={<FormattedMessage {...messages.organization} />}
          name="selectedOrganization"
          required
        >
          {organizations.map((organization, index) => (
            <option key={organization.id} value={index}>
              {organization.id}
            </option>
          ))}
        </SimpleInput>
        <SimpleInput
          label={<FormattedMessage {...messages.description} />}
          maxLength={80}
          name="appDescription"
        />
        <SimpleInput
          component={Select}
          label={<FormattedMessage {...messages.template} />}
          name="selectedTemplate"
          onChange={({ target }) => setSelectedTemplate(target.value)}
          required
        >
          {templates.map((template, index) => (
            <option key={template.name} value={index}>
              {template.name}
            </option>
          ))}
        </SimpleInput>
        <article className="message">
          <div className="message-body">{templates[selectedTemplate].description}</div>
        </article>
        <SimpleInput
          className="is-warning"
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
    </div>
  );
}
