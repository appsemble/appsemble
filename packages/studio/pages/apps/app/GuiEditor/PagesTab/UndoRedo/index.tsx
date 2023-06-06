import { Button } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface UndoRedoProps {
  index: number;
  onRedo: () => void;
  onUndo: () => void;
  stackSize: number;
}

export function UndoRedo({ index, onRedo, onUndo, stackSize }: UndoRedoProps): ReactElement {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.undoredoContainer}>
      <Button
        className={styles.undoButton}
        disabled={index < 1}
        icon="rotate-left"
        onClick={onUndo}
        title={formatMessage(messages.undo)}
      />
      <Button
        className={styles.redoButton}
        disabled={index >= stackSize}
        icon="rotate-right"
        onClick={onRedo}
        title={formatMessage(messages.redo)}
      />
    </div>
  );
}
