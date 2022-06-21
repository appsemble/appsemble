import {
  FileUpload,
  Select,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
  Title,
  useMeta,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { IconPreview } from '../../../../components/IconPreview';
import { useUser } from '../../../../components/UserProvider';
import { Organization } from '../../../../types';
import { messages } from './messages';

interface SettingsPageProps {
  /**
   * The organization the settings belong to.
   */
  organization: Organization;

  /**
   * Change handler used to update the organization for the parent component.
   */
  onChangeOrganization: (organization: Organization) => void;
}

/**
 * Strip a website link protocol.
 *
 * @param link - The website link to strip the protocol from.
 * @returns The website link without protocol.
 */
function preprocessWebsite(link: string): string {
  return link.replace(/^https?:\/\//, '');
}

/**
 * The page for configuring various settings of an organization.
 */
export function SettingsPage({
  onChangeOrganization,
  organization,
}: SettingsPageProps): ReactElement {
  const { setOrganizations } = useUser();
  const { formatMessage } = useIntl();

  const onEditOrganization = useCallback(
    async ({ description, email, icon, name, website, websiteProtocol }) => {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('description', description);
      formData.set('email', email);
      formData.set('website', website ? `${websiteProtocol}://${website}` : '');

      if (icon) {
        formData.set('icon', icon);
      }

      await axios.patch(`/api/organizations/${organization.id}`, formData);
      setOrganizations((organizations) =>
        organizations.map((org) =>
          org.id === organization.id ? { ...org, name, description, website, email } : org,
        ),
      );
      onChangeOrganization({ ...organization, name, description, website, email });
    },
    [organization, setOrganizations, onChangeOrganization],
  );

  useMeta(formatMessage(messages.settings));

  const defaultValues = useMemo(
    () => ({
      name: organization.name || '',
      email: organization.email || '',
      website: organization.website?.replace(/^https?:\/\//, '') || '',
      websiteProtocol: organization.website?.startsWith('http://') ? 'http' : 'https',
      description: organization.description || '',
      icon: null,
    }),
    [organization],
  );

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} values={{ name: organization.name }} />
      </Title>
      <SimpleForm defaultValues={defaultValues} onSubmit={onEditOrganization}>
        <SimpleFormField
          help={<FormattedMessage {...messages.nameDescription} />}
          label={<FormattedMessage {...messages.name} />}
          maxLength={30}
          minLength={1}
          name="name"
        />
        <SimpleFormField
          addonLeft={
            <SimpleFormField component={Select} name="websiteProtocol">
              <option value="https">https://</option>
              <option value="http">http://</option>
            </SimpleFormField>
          }
          help={<FormattedMessage {...messages.websiteDescription} />}
          label={<FormattedMessage {...messages.website} />}
          name="website"
          preprocess={preprocessWebsite}
        />
        <SimpleFormField
          help={<FormattedMessage {...messages.emailDescription} />}
          label={<FormattedMessage {...messages.email} />}
          name="email"
          type="email"
        />
        <SimpleFormField
          help={<FormattedMessage {...messages.descriptionDescription} />}
          label={<FormattedMessage {...messages.description} />}
          maxLength={160}
          name="description"
        />
        <SimpleFormField
          accept="image/jpeg, image/png, image/tiff, image/webp"
          component={FileUpload}
          fileButtonLabel={<FormattedMessage {...messages.logo} />}
          fileLabel={<FormattedMessage {...messages.selectFile} />}
          help={<FormattedMessage {...messages.logoDescription} />}
          label={<FormattedMessage {...messages.logo} />}
          name="icon"
          preview={<IconPreview organization={organization} />}
        />
        <SimpleSubmit>
          <FormattedMessage {...messages.submit} />
        </SimpleSubmit>
      </SimpleForm>
    </>
  );
}
