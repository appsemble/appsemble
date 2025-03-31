import {
  ModalCard,
  SimpleForm,
  SimpleFormError,
  SimpleModalFooter,
  type Toggle,
} from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { CollectionFields } from '../../CollectionFields/index.js';

interface AddCollectionModalProps {
  /**
   * The state of the modal.
   */
  readonly state: Toggle;

  /**
   * This is called when a new collection has been created.
   *
   * @param collection The newly created collection.
   */
  readonly onCreated: (collection: AppCollection) => void;
}

const defaultValues = {
  name: '',
  isPrivate: false,
  expertName: '',
  expertDescription: '',
  domain: null as string | null,
};

export function AddCollectionModal({ onCreated, state }: AddCollectionModalProps): ReactNode {
  const [header, setHeader] = useState<File>();
  const [expertPhoto, setExpertPhoto] = useState<File>();

  const { organizationId } = useParams<{ organizationId: string }>();

  const closeModal = useCallback(() => {
    setHeader(null);
    setExpertPhoto(null);
    state.disable();
  }, [state]);
  const onSubmit = useCallback(
    async ({ domain, expertDescription, expertName, isPrivate, name }: typeof defaultValues) => {
      const form = new FormData();
      form.append('name', name);
      form.append('visibility', isPrivate ? 'private' : 'public');
      form.append('expertName', expertName);
      form.append('expertDescription', expertDescription);
      form.append('headerImage', header, header.name);
      form.append('expertProfileImage', expertPhoto, expertPhoto.name);
      if (domain) {
        form.append('domain', domain);
      }
      const { data } = await axios.post<AppCollection>(
        `/api/organizations/${organizationId}/app-collections`,
        form,
      );
      onCreated(data);
      closeModal();
    },
    [onCreated, expertPhoto, header, organizationId, closeModal],
  );

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={defaultValues}
      footer={
        <SimpleModalFooter
          cancelLabel={<FormattedMessage {...messages.cancel} />}
          disabled={!header || !expertPhoto}
          onClose={closeModal}
          submitLabel={<FormattedMessage {...messages.create} />}
        />
      }
      isActive={state.enabled}
      onClose={closeModal}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.title} />}
    >
      <SimpleFormError>
        {({ error }) =>
          axios.isAxiosError(error) && error.response?.status === 409 ? (
            <FormattedMessage {...messages.nameConflict} />
          ) : (
            <FormattedMessage {...messages.error} />
          )
        }
      </SimpleFormError>
      <CollectionFields
        expertPhoto={expertPhoto}
        header={header}
        onExpertPhotoChange={setExpertPhoto}
        onHeaderChange={setHeader}
      />
    </ModalCard>
  );
}
