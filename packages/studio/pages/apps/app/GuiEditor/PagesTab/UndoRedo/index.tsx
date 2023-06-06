import { Button } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface UndoRedoProps {
  getIndex: () => number;
  getStackSize: () => number;
  onRedo: () => void;
  onUndo: () => void;
}

export function UndoRedo({ getIndex, getStackSize, onRedo, onUndo }: UndoRedoProps): ReactElement {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.undoredoContainer}>
      <Button
        className={styles.undoButton}
        disabled={getIndex() < 1}
        icon="rotate-left"
        onClick={onUndo}
        title={formatMessage(messages.undo)}
      />
      <Button
        className={styles.redoButton}
        disabled={getIndex() >= getStackSize()}
        icon="rotate-right"
        onClick={onRedo}
        title={formatMessage(messages.redo)}
      />
    </div>
  );
}
