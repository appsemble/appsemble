import {
  CardFooterButton,
  FileUpload,
  Modal,
  SimpleForm,
  SimpleFormField,
  Toggle,
  useObjectURL,
} from '@appsemble/react-components';
import React, { ChangeEvent, ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { UserOrganization } from '../../UserProvider';
import styles from './index.css';
import { messages } from './messages';

interface EditOrganizationModalProps {
  editModal: Toggle;
  organization: UserOrganization;
  onEditOrganization: ({ name }: any) => Promise<void>;
  onLogoChange: (e: ChangeEvent<HTMLInputElement>) => void;
  icon: File;
}

export function EditOrganizationModal({
  editModal,
  icon,
  onEditOrganization,
  onLogoChange,
  organization,
}: EditOrganizationModalProps): ReactElement {
  const { formatMessage } = useIntl();
  const editingIconUrl = useObjectURL(icon || organization.iconUrl);

  return (
    <Modal
      component={SimpleForm}
      defaultValues={{
        name: organization.name,
      }}
      footer={
        <>
          <CardFooterButton onClick={editModal.disable}>
            <FormattedMessage {...messages.cancel} />
          </CardFooterButton>
          <CardFooterButton color="primary" type="submit">
            <FormattedMessage {...messages.submit} />
          </CardFooterButton>
        </>
      }
      isActive={editModal.enabled}
      onClose={editModal.disable}
      onSubmit={onEditOrganization}
      title={<FormattedMessage {...messages.edit} />}
    >
      <SimpleFormField
        help={<FormattedMessage {...messages.nameDescription} />}
        label={<FormattedMessage {...messages.name} />}
        maxLength={30}
        minLength={1}
        name="name"
      />
      <FileUpload
        accept="image/jpeg, image/png, image/tiff, image/webp"
        fileButtonLabel={<FormattedMessage {...messages.logo} />}
        fileLabel={<FormattedMessage {...messages.noFile} />}
        help={<FormattedMessage {...messages.logoDescription} />}
        label={<FormattedMessage {...messages.logo} />}
        name="logo"
        onChange={onLogoChange}
        preview={
          <figure className="image is-128x128 mb-2">
            <img alt={formatMessage(messages.logo)} className={styles.icon} src={editingIconUrl} />
          </figure>
        }
      />
    </Modal>
  );
}
