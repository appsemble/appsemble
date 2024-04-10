import {
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  type Toggle,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import { type AppConfigEntry } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../index.js';

interface AppVariableCardProps {
  /**
   * Called when the variable has been updated successfully.
   *
   * @param newProvider The new variable values.
   * @param oldProvider The old variable values to replace
   */
  readonly onSubmit: (values: AppConfigEntry) => Promise<void>;

  /**
   * The current variable values.
   */
  readonly variable: AppConfigEntry;

  /**
   * The toggle used for managing the modal.
   */
  readonly toggle: Toggle;

  /**
   * Called when the variable has been updated successfully.
   */
  readonly onDeleted?: (variable: AppConfigEntry) => void;
}

/**
 * Render a modal for editing an OAuth2 app secret.
 */
export function VariableModal({
  onDeleted,
  onSubmit,
  toggle,
  variable,
}: AppVariableCardProps): ReactNode {
  const { formatMessage } = useIntl();
  const {
    app: { locked },
  } = useApp();

  const push = useMessages();
  const { app } = useApp();

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    color: 'danger',
    async action() {
      await axios.delete(`/api/apps/${app.id}/variables/${variable.id}`);

      push({
        body: formatMessage(messages.deleteSuccess, { name: variable.name }),
        color: 'info',
      });
      onDeleted(variable);
    },
  });

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={variable}
      footer={
        <SimpleModalFooter
          cancelLabel={<FormattedMessage {...messages.close} />}
          onClose={toggle.disable}
          submitLabel={<FormattedMessage {...messages.save} />}
        />
      }
      isActive={toggle.enabled}
      onClose={toggle.disable}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.modalTitle} />}
    >
      <SimpleFormField
        disabled={locked !== 'unlocked'}
        help={<FormattedMessage {...messages.nameHelp} />}
        label={<FormattedMessage {...messages.nameLabel} />}
        name="name"
        required
      />
      <SimpleFormField
        disabled={locked !== 'unlocked'}
        help={<FormattedMessage {...messages.valueHelp} />}
        label={<FormattedMessage {...messages.valueLabel} />}
        name="value"
        required
      />
      {onDeleted ? (
        <Button className={styles.deleteButton} color="danger" icon="trash" onClick={onDelete}>
          <FormattedMessage {...messages.deleteButton} />
        </Button>
      ) : null}
    </ModalCard>
  );
}
