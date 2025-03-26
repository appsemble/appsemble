import {
  FileUpload,
  ModalCard,
  Select,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  type Toggle,
} from '@appsemble/react-components';
import { type Organization, PredefinedOrganizationRole } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { IconPreview } from '../IconPreview/index.js';
import { useUser } from '../UserProvider/index.js';

/**
 * Calculate an organization id based on a given organization name.
 *
 * @param name The name to base the ID on.
 * @param newValues The new values to apply the ID on.
 * @param oldValues The old values to compare the ID to.
 * @returns An updated organization object containing the new ID.
 */
export function preprocessOrganization(
  name: string,
  newValues: Organization,
  oldValues: Organization,
): Organization {
  if (name !== 'name') {
    return newValues;
  }
  if (normalize(oldValues.name) === oldValues.id) {
    return {
      ...newValues,
      id: normalize(newValues.name).slice(0, 30).replace(/-+$/, ''),
    };
  }
  return newValues;
}

interface CreateOrganizationModalProps {
  /**
   * Whether the modal should be visible or not.
   */
  readonly isActive: Toggle['enabled'];

  /**
   * The function used to close the modal.
   */
  readonly onClose: Toggle['disable'];

  /**
   * The callback that is called when a new organization is created.
   */
  readonly onCreateOrganization?: (organization: Organization) => void;

  /**
   * The default values for the new organization.
   */
  readonly defaultValues?: Omit<Organization, 'iconUrl'>;

  /**
   * Additional information that is rendered at the top of the SimpleForm.
   */
  readonly help?: ReactNode;

  /**
   * Whether the form should be disabled.
   */
  readonly disabled?: boolean;

  /**
   * The title to display for the modal.
   */
  readonly title: ReactNode;
}

const defaults = {
  description: '',
  email: '',
  id: '',
  name: '',
  website: '',
  websiteProtocol: 'https',
  icon: null as File,
};

/**
 * Strip a website link protocol.
 *
 * @param link The website link to strip the protocol from.
 * @returns The website link without protocol.
 */
function preprocessWebsite(link: string): string {
  return link.replace(/^https?:\/\//, '');
}

/**
 * Render the CreateOrganizationForm component in a modal card.
 */
export function CreateOrganizationModal({
  defaultValues = defaults,
  disabled,
  help,
  isActive,
  onClose,
  onCreateOrganization,
  title,
}: CreateOrganizationModalProps): ReactNode {
  const { organizations, setOrganizations } = useUser();

  const submitOrganization = useCallback(
    async ({ description, email, icon, id, name, website, websiteProtocol }: typeof defaults) => {
      const formData = new FormData();
      formData.set('id', normalize(id));
      formData.set('name', name);
      formData.set('description', description);
      formData.set('email', email);
      formData.set('website', website ? `${websiteProtocol}://${website}` : '');

      if (icon) {
        formData.set('icon', icon);
      }

      const { data } = await axios.post<Organization>('/api/organizations', formData);
      setOrganizations([...organizations, { ...data, role: PredefinedOrganizationRole.Owner }]);
      onCreateOrganization?.(data);
    },
    [setOrganizations, organizations, onCreateOrganization],
  );

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={defaultValues}
      footer={
        <SimpleModalFooter
          cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
          onClose={onClose}
          submitLabel={<FormattedMessage {...messages.createButton} />}
        />
      }
      id="create-organization"
      isActive={isActive}
      onClose={onClose}
      onSubmit={submitOrganization}
      preprocess={preprocessOrganization}
      resetOnSuccess
      title={title}
    >
      {help}
      <SimpleFormError>
        {(error) =>
          axios.isAxiosError(error) && error.response?.status === 409 ? (
            <FormattedMessage {...messages.conflict} />
          ) : (
            <FormattedMessage {...messages.error} />
          )
        }
      </SimpleFormError>
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.organizationNameDescription} />}
        icon="briefcase"
        label={<FormattedMessage {...messages.organizationName} />}
        name="name"
      />
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.organizationIdDescription} />}
        icon="at"
        label={<FormattedMessage {...messages.organizationId} />}
        maxLength={30}
        name="id"
        preprocess={(value) => normalize(value, false)}
        required
      />
      <SimpleFormField
        addonLeft={
          <SimpleFormField component={Select} name="websiteProtocol">
            <option value="https">https://</option>
            <option value="http">http://</option>
          </SimpleFormField>
        }
        disabled={disabled}
        help={<FormattedMessage {...messages.websiteDescription} />}
        label={<FormattedMessage {...messages.website} />}
        name="website"
        preprocess={preprocessWebsite}
      />
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.emailDescription} />}
        icon="envelope"
        label={<FormattedMessage {...messages.email} />}
        name="email"
        type="email"
      />
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.descriptionDescription} />}
        icon="info"
        label={<FormattedMessage {...messages.description} />}
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
        preview={<IconPreview organization={{ iconUrl: null } as Organization} />}
      />
    </ModalCard>
  );
}
