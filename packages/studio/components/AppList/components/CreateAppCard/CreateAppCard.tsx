import {
  CardFooterButton,
  Checkbox,
  Message,
  Modal,
  Select,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
} from '@appsemble/react-components';
import axios, { AxiosError } from 'axios';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';

import useOrganizations from '../../../../hooks/useOrganizations';
import styles from './CreateAppCard.css';
import messages from './messages';

interface Template {
  id: number;
  name: string;
  description: string;
  resources: boolean;
}

export default function CreateAppCard(): React.ReactElement {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [templates, setTemplates] = React.useState<Template[]>(null);
  const [selectedTemplate, setSelectedTemplate] = React.useState(0);

  const history = useHistory();
  const match = useRouteMatch();
  const organizations = useOrganizations();

  const closeModal = React.useCallback(() => {
    setModalOpen(false);
  }, []);

  const openModal = React.useCallback(() => {
    setModalOpen(true);
  }, []);

  const onCreate = React.useCallback(
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
      history.push(`${match.url}/${data.id}/edit`);
    },
    [history, match.url, organizations, selectedTemplate, templates],
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
          selectedOrganization: 0,
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
          onChange={({ target }) => setSelectedTemplate(target.value)}
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
