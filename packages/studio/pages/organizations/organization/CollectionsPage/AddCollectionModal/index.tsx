import {
  CheckboxField,
  FileUpload,
  Message,
  ModalCard,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  TextAreaField,
  type Toggle,
  useToggle,
} from '@appsemble/react-components';
import { type AppCollection } from '@appsemble/types';
import axios from 'axios';
import { type ChangeEvent, type ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { AvatarEditorModal } from '../../../../../components/AvatarEditorModal/index.js';

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
};

export function AddCollectionModal({ onCreated, state }: AddCollectionModalProps): ReactElement {
  const [uploadingHeader, setUploadingHeader] = useState<File>();
  const [uploadingExpertPhoto, setUploadingExpertPhoto] = useState<File>();

  const { organizationId } = useParams<{ organizationId: string }>();

  const avatarModalToggle = useToggle();

  const closeModal = useCallback(() => {
    setUploadingHeader(null);
    setUploadingExpertPhoto(null);
    state.disable();
  }, [state]);
  const onSubmit = useCallback(
    async ({ expertDescription, expertName, isPrivate, name }: typeof defaultValues) => {
      const form = new FormData();
      form.append('name', name);
      form.append('visibility', isPrivate ? 'private' : 'public');
      form.append('expertName', expertName);
      form.append('expertDescription', expertDescription);
      form.append('headerImage', uploadingHeader, uploadingHeader.name);
      form.append('expertProfileImage', uploadingExpertPhoto, uploadingExpertPhoto.name);
      const { data } = await axios.post<AppCollection>(
        `/api/organizations/${organizationId}/appCollections`,
        form,
      );
      onCreated(data);
      closeModal();
    },
    [onCreated, uploadingExpertPhoto, uploadingHeader, organizationId, closeModal],
  );
  const onHeaderChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setUploadingHeader(event.currentTarget.files[0]);
  }, []);
  const onExpertPhotoChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setUploadingExpertPhoto(event.currentTarget.files[0]);
      if (event.currentTarget.files[0]) {
        avatarModalToggle.enable();
      }
    },
    [avatarModalToggle],
  );

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={defaultValues}
      footer={
        <SimpleModalFooter
          cancelLabel={<FormattedMessage {...messages.cancel} />}
          disabled={!uploadingHeader || !uploadingExpertPhoto}
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
          axios.isAxiosError(error) && error.response.status === 409 ? (
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
        accept="image/png,image/jpeg,image/tiff,image/webp"
        component={FileUpload}
        fileButtonLabel={<FormattedMessage {...messages.headerImage} />}
        fileLabel={uploadingHeader?.name ?? <FormattedMessage {...messages.noFile} />}
        label={<FormattedMessage {...messages.headerImage} />}
        name="headerImage"
        onChange={onHeaderChange}
        required
      />
      <SimpleFormField
        component={CheckboxField}
        label={<FormattedMessage {...messages.private} />}
        name="isPrivate"
        title={<FormattedMessage {...messages.privateExplanation} />}
      />
      <SimpleFormField
        label={<FormattedMessage {...messages.expertName} />}
        maxLength={30}
        minLength={1}
        name="expertName"
        required
      />
      <SimpleFormField
        component={TextAreaField}
        label={<FormattedMessage {...messages.expertDescription} />}
        maxLength={4000}
        minLength={1}
        name="expertDescription"
      />
      <Message>
        <FormattedMessage
          {...messages.markdownTips}
          values={{
            markdownLink: (
              <a
                href="https://www.markdownguide.org/cheat-sheet/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Markdown
              </a>
            ),
            imageHostingLink: (
              <a href="https://imgur.com/" rel="noopener noreferrer" target="_blank">
                Imgur
              </a>
            ),
          }}
        />
      </Message>
      <FileUpload
        accept="image/png,image/jpeg,image/tiff,image/webp"
        fileButtonLabel={<FormattedMessage {...messages.expertPhoto} />}
        fileLabel={uploadingExpertPhoto?.name ?? <FormattedMessage {...messages.noFile} />}
        label={<FormattedMessage {...messages.expertPhoto} />}
        name="expertProfileImage"
        onChange={onExpertPhotoChange}
        required
        value={uploadingExpertPhoto}
      />
      <AvatarEditorModal
        onCanceled={() => setUploadingExpertPhoto(null)}
        onCompleted={setUploadingExpertPhoto}
        photo={uploadingExpertPhoto}
        state={avatarModalToggle}
      />
    </ModalCard>
  );
}
