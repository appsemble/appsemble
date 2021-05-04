import { ModalCard, SimpleModalFooter, Toggle } from '@appsemble/react-components';
import { Organization } from '@appsemble/types';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { preprocessOrganization } from '../../utils/preprocess';
import { CreateOrganizationForm } from '../CreateOrganizationForm';
import styles from './index.module.css';
import { messages } from './messages';

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
  onCreateOrganization: (organization: Organization) => void;

  /**
   * The default values for the new organization.
   */
  defaultValues?: Omit<Organization, 'iconUrl'>;
}

/**
 * Render the CreateOrganizationForm component in a modal card.
 */
export function CreateOrganizationModal({
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
}: CreateOrganizationModalProps): ReactElement {
  return (
    <ModalCard
      isActive={isActive}
      onClose={onClose}
      title={<FormattedMessage {...messages.title} />}
    >
      <CreateOrganizationForm
        defaultValues={defaultValues}
        footer={
          <div className={`${styles.footer} card-footer`}>
            <SimpleModalFooter
              cancelLabel={<FormattedMessage {...messages.cancelLabel} />}
              onClose={onClose}
              submitLabel={<FormattedMessage {...messages.createButton} />}
            />
          </div>
        }
        onSubmit={onCreateOrganization}
        preprocess={preprocessOrganization}
        resetOnSuccess
      />
    </ModalCard>
  );
}
