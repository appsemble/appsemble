import { SimpleForm, SimpleFormField } from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import { ComponentPropsWithoutRef, ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { useUser } from '../UserProvider';
import { messages } from './messages';

interface CreateOrganizationModalProps
  extends Omit<
    ComponentPropsWithoutRef<typeof SimpleForm>,
    'children' | 'defaultValues' | 'onSubmit'
  > {
  /**
   * The callback that is called when a new organization is created.
   */
  onSubmit?: (organization: Organization) => void;

  /**
   * The default values for the new organization.
   */
  defaultValues?: Omit<Organization, 'iconUrl'>;

  /**
   * The footer to use for the form.
   */
  footer?: ReactElement;

  /**
   * Whether the form should be disabled.
   */
  disabled?: boolean;
}

/**
 * Calculate an organization id based on a given organization name.
 *
 * @param name - The name to base the ID on.
 * @param newValues - The new values to apply the ID on.
 * @param oldValues - The old values to compare the ID to.
 * @returns An updated organization object containing the new ID.
 */
function calculateOrganizationId(
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

/**
 * Render a form that can register a new organization.
 */
export function CreateOrganizationForm({
  onSubmit,
  defaultValues = {
    id: '',
    name: '',
    description: '',
    website: '',
    email: '',
  },
  footer,
  disabled,
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
      onSubmit?.(data);
    },
    [setOrganizations, organizations, onSubmit],
  );

  return (
    <SimpleForm
      defaultValues={defaultValues}
      onSubmit={submitOrganization}
      preprocess={calculateOrganizationId}
      resetOnSuccess
    >
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
      {footer}
    </SimpleForm>
  );
}
