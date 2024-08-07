import {
  Button,
  Content,
  FormButtons,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleSubmit,
  useConfirmation,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import axios from 'axios';
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { messages } from './messages.js';
import { CollectionFields } from '../../CollectionFields/index.js';
import { messages as collectionMessages } from '../messages.js';

interface SettingsPageProps {
  readonly collection: AppCollection;
  readonly setCollection: Dispatch<SetStateAction<AppCollection>>;
}

export function SettingsPage({ collection, setCollection }: SettingsPageProps): ReactNode {
  useMeta(collectionMessages.settings);
  const defaultValues = useMemo(
    () => ({
      name: collection.name,
      isPrivate: collection.visibility === 'private',
      expertName: collection.$expert.name,
      expertDescription: collection.$expert.description,
      domain: collection.domain,
    }),
    [collection],
  );

  const push = useMessages();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const [header, setHeader] = useState<File | null>(null);
  const [expertPhoto, setExpertPhoto] = useState<File | null>(null);

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      const { id } = collection;
      try {
        await axios.delete(`/api/app-collections/${id}`);
        push({
          color: 'info',
          body: formatMessage(messages.deleteSuccess, {
            name: collection.name,
          }),
        });
        navigate('../..');
      } catch {
        push({
          color: 'danger',
          body: formatMessage(messages.deleteError),
        });
      }
    },
  });

  const onSubmit = useCallback(
    async ({ domain, expertDescription, expertName, isPrivate, name }: typeof defaultValues) => {
      const formData = new FormData();
      if (name !== defaultValues.name) {
        formData.append('name', name);
      }
      if (isPrivate !== defaultValues.isPrivate) {
        formData.append('visibility', isPrivate ? 'private' : 'public');
      }
      if (expertName !== defaultValues.expertName) {
        formData.append('expertName', expertName);
      }
      if (expertDescription !== defaultValues.expertDescription) {
        formData.append('expertDescription', expertDescription);
      }
      if (domain !== defaultValues.domain) {
        formData.append('domain', domain);
      }
      if (header) {
        formData.append('headerImage', header, header.name);
      }
      if (expertPhoto) {
        formData.append('expertProfileImage', expertPhoto, expertPhoto.name);
      }
      const { data } = await axios.patch<AppCollection>(
        `/api/app-collections/${collection.id}`,
        formData,
      );
      push({ color: 'success', body: formatMessage(messages.updateSuccess) });
      setCollection(data);
    },
    [push, collection, formatMessage, setCollection, defaultValues, header, expertPhoto],
  );

  return (
    <>
      <Content fullwidth>
        <SimpleForm defaultValues={defaultValues} onSubmit={onSubmit}>
          <SimpleFormError>{() => <FormattedMessage {...messages.updateError} />}</SimpleFormError>
          <CollectionFields
            expertPhoto={expertPhoto}
            header={header}
            onExpertPhotoChange={setExpertPhoto}
            onHeaderChange={setHeader}
          />
          <FormButtons>
            <SimpleSubmit color="primary" type="submit">
              <FormattedMessage {...messages.save} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </Content>
      <hr />
      <Content>
        <Message color="danger" header={<FormattedMessage {...messages.dangerZone} />}>
          <p className="content">
            <FormattedMessage {...messages.deleteHelp} />
          </p>
          <Button color="danger" icon="trash-alt" onClick={onDelete}>
            <FormattedMessage {...messages.delete} />
          </Button>
        </Message>
      </Content>
    </>
  );
}
