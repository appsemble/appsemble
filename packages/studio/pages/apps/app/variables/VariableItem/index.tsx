import { useToggle } from '@appsemble/react-components';
import { type AppConfigEntry } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';

import { ListButton } from '../../../../../components/ListButton/index.js';
import { useApp } from '../../index.js';
import { VariableModal } from '../VariableModal/index.js';

interface VariableItemProps {
  /**
   * Called when the variable has been updated successfully.
   *
   * @param newProvider The new variable values.
   * @param oldProvider The old variable values to replace
   */
  readonly onUpdated: (newVariable: AppConfigEntry, oldVariable: AppConfigEntry) => void;

  /**
   * The current variable values.
   */
  readonly variable: AppConfigEntry;

  /**
   * Called when variable has been deleted successfully.
   */
  readonly onDeleted: (secret: AppConfigEntry) => void;
}

/**
 * Render an OAuth2 app secret that may be updated.
 */
export function VariableItem({ onDeleted, onUpdated, variable }: VariableItemProps): ReactNode {
  const modal = useToggle();
  const { app } = useApp();

  const onSubmit = useCallback(
    async (values: AppConfigEntry) => {
      const { data } = await axios.put<AppConfigEntry>(
        `/api/apps/${app.id}/variables/${values.id}`,
        values,
      );
      modal.disable();
      onUpdated(data, variable);
    },
    [app, modal, onUpdated, variable],
  );

  return (
    <>
      <ListButton icon="code" onClick={modal.enable} title={variable.name} />
      <VariableModal onDeleted={onDeleted} onSubmit={onSubmit} toggle={modal} variable={variable} />
    </>
  );
}
