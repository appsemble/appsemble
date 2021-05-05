import {
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  Toggle,
} from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { useUser } from '../UserProvider';
import { messages } from './messages';

/**
 * Calculate an organization id based on a given organization name.
 *
 * @param name - The name to base the ID on.
 * @param newValues - The new values to apply the ID on.
 * @param oldValues - The old values to compare the ID to.
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
  isActive: Toggle['enabled'];

  /**
   * The function used to close the modal.
   */
  onClose: Toggle['disable'];

  /**
   * The callback that is called when a new organization is created.
   */
  onCreateOrganization?: (organization: Organization) => void;

  /**
   * The default values for the new organization.
   */
  defaultValues?: Omit<Organization, 'iconUrl'>;

  /**
   * Additional information that is rendered at the top of the SimpleForm.
   */
  help?: ReactElement;

  /**
   * Whether the form should be disabled.
   */
  disabled?: boolean;

  /**
   * The title to display for the modal.
   */
  title: ReactElement;
}

/**
 * Render the CreateOrganizationForm component in a modal card.
 */
export function CreateOrganizationModal({
  help,
  isActive,
  onClose,
  onCreateOrganization,
  defaultValues = {
    id: '',
    name: '',
    description: '',
    website: '',
    email: '',
  },
  disabled,
  title,
}: CreateOrganizationModalProps): ReactElement {
  const { organizations, setOrganizations } = useUser();

  const submitOrganization = useCallback(
    async ({ description, email, id, name, website }: Organization) => {
      const { data } = await axios.post<Organization>('/api/organizations', {
        name,
        id: normalize(id),
        description,
        email,
        website,
      });
      setOrganizations([...organizations, { ...data, role: 'Owner' }]);
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
      isActive={isActive}
      onClose={onClose}
      onSubmit={submitOrganization}
      preprocess={preprocessOrganization}
      resetOnSuccess
      title={title}
    >
      {help}
      <SimpleFormField
        disabled={disabled}
        icon="briefcase"
        label={<FormattedMessage {...messages.organizationName} />}
        name="name"
      />
      <SimpleFormField
        disabled={disabled}
        icon="at"
        label={<FormattedMessage {...messages.organizationId} />}
        maxLength={30}
        name="id"
        preprocess={(value) => normalize(value, false)}
        required
      />
      <SimpleFormField
        disabled={disabled}
        icon="globe"
        label={<FormattedMessage {...messages.website} />}
        name="website"
        type="url"
      />
      <SimpleFormField
        disabled={disabled}
        icon="envelope"
        label={<FormattedMessage {...messages.email} />}
        name="email"
        type="email"
      />
      <SimpleFormField
        disabled={disabled}
        icon="info"
        label={<FormattedMessage {...messages.description} />}
        name="description"
      />
    </ModalCard>
  );
}
