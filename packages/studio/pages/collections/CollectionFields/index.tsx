import {
  CheckboxField,
  FileUpload,
  Message,
  SimpleFormField,
  TextAreaField,
  useSimpleForm,
  useToggle,
} from '@appsemble/react-components';
import { type ChangeEvent, type ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { AvatarEditorModal } from '../../../components/AvatarEditorModal/index.js';

interface CollectionFieldsProps {
  readonly header: File | null;
  readonly expertPhoto: File | null;
  readonly onHeaderChange: (file: File | null) => void;
  readonly onExpertPhotoChange: (file: File | null) => void;
}

export function CollectionFields({
  expertPhoto,
  header,
  onExpertPhotoChange,
  onHeaderChange,
}: CollectionFieldsProps): ReactElement {
  const avatarModalToggle = useToggle();

  const { setValue } = useSimpleForm();

  const handleExpertPhotoChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onExpertPhotoChange(event.target.files?.[0] ?? null);
      if (event.currentTarget.files[0]) {
        avatarModalToggle.enable();
      }
    },
    [avatarModalToggle, onExpertPhotoChange],
  );
  const handleHeaderChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onHeaderChange(event.target.files?.[0] ?? null);
    },
    [onHeaderChange],
  );

  return (
    <>
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
        fileLabel={header?.name ?? <FormattedMessage {...messages.noFile} />}
        label={<FormattedMessage {...messages.headerImage} />}
        name="headerImage"
        onChange={handleHeaderChange}
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
      <SimpleFormField
        accept="image/png,image/jpeg,image/tiff,image/webp"
        component={FileUpload}
        fileButtonLabel={<FormattedMessage {...messages.expertPhoto} />}
        fileLabel={expertPhoto?.name ?? <FormattedMessage {...messages.noFile} />}
        label={<FormattedMessage {...messages.expertPhoto} />}
        name="expertProfileImage"
        onChange={handleExpertPhotoChange}
        required
      />
      <AvatarEditorModal
        onCanceled={() => {
          setValue('expertProfileImage', null);
          onExpertPhotoChange(null);
        }}
        onCompleted={onExpertPhotoChange}
        photo={expertPhoto}
        state={avatarModalToggle}
      />
    </>
  );
}
