import {
  FileUpload,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
  Title,
  useMeta,
  useObjectURL,
} from '@appsemble/react-components';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUser } from '../../../../components/UserProvider';
import { Organization } from '../../../../types';
import styles from './index.module.css';
import { messages } from './messages';

interface OrganizationSettingsPageProps {
  organization: Organization;
  setOrganization: (organization: Organization) => void;
}

/**
 * The page for configuring various settings of an organization.
 */
export function OrganizationSettingsPage({
  organization,
  setOrganization,
}: OrganizationSettingsPageProps): ReactElement {
  const { organizations, setOrganizations } = useUser();
  const { formatMessage } = useIntl();
  const [icon, setIcon] = useState<File>();

  const onLogoChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setIcon(e.currentTarget.files[0]);
  }, []);

  const onEditOrganization = useCallback(
    async ({ name }) => {
      const formData = new FormData();
      formData.set('name', name);

      if (icon) {
        formData.set('icon', icon);
      }

      await axios.patch(`/api/organizations/${organization.id}`, formData);
      setOrganizations(
        organizations.map((org) => (org.id === organization.id ? { ...org, name } : org)),
      );
      setOrganization({ ...organization, name });
    },
    [icon, organization, organizations, setOrganization, setOrganizations],
  );

  const iconUrl = useObjectURL(icon || organization.iconUrl);
  useMeta(formatMessage(messages.settings));

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} values={{ name: organization.name }} />
      </Title>
      <SimpleForm
        defaultValues={{
          name: organization.name,
        }}
        onSubmit={onEditOrganization}
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
              <img alt={formatMessage(messages.logo)} className={styles.icon} src={iconUrl} />
            </figure>
          }
        />
        <SimpleSubmit>
          <FormattedMessage {...messages.submit} />
        </SimpleSubmit>
      </SimpleForm>
    </>
  );
}
