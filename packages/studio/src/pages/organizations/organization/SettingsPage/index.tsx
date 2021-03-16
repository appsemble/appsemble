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

interface SettingsPageProps {
  organization: Organization;
  onChangeOrganization: (organization: Organization) => void;
}

/**
 * The page for configuring various settings of an organization.
 */
export function SettingsPage({
  onChangeOrganization,
  organization,
}: SettingsPageProps): ReactElement {
  const { organizations, setOrganizations } = useUser();
  const { formatMessage } = useIntl();
  const [icon, setIcon] = useState<File>();

  const onLogoChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setIcon(e.currentTarget.files[0]);
  }, []);

  const onEditOrganization = useCallback(
    async ({ description, email, name, website }) => {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('description', description);
      formData.set('email', email);
      formData.set('website', website);

      if (icon) {
        formData.set('icon', icon);
      }

      await axios.patch(`/api/organizations/${organization.id}`, formData);
      setOrganizations(
        organizations.map((org) =>
          org.id === organization.id ? { ...org, name, description, website, email } : org,
        ),
      );
      onChangeOrganization({ ...organization, name, description, website, email });
    },
    [icon, organization, organizations, setOrganizations, onChangeOrganization],
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
          email: organization.email,
          website: organization.website,
          description: organization.description,
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
        <SimpleFormField
          help={<FormattedMessage {...messages.emailDescription} />}
          label={<FormattedMessage {...messages.email} />}
          name="email"
          type="email"
        />
        <SimpleFormField
          help={<FormattedMessage {...messages.websiteDescription} />}
          label={<FormattedMessage {...messages.website} />}
          name="website"
          type="url"
        />
        <SimpleFormField
          help={<FormattedMessage {...messages.descriptionDescription} />}
          label={<FormattedMessage {...messages.description} />}
          maxLength={160}
          name="description"
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
