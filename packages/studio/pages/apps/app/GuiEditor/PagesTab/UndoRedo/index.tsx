import { Button } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface UndoRedoProps {
  getStackSize: () => number;
  redoEventListener: () => void;
  undoEventListener: () => void;
}

export function UndoRedo({
  getStackSize,
  redoEventListener,
  undoEventListener,
}: UndoRedoProps): ReactElement {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.undoredoContainer}>
      <Button
        className={styles.undoButton}
        disabled={getStackSize() < 1}
        onClick={undoEventListener}
        title={formatMessage(messages.undo)}
      >
        Undo
      </Button>
      <Button
        className={styles.redoButton}
        onClick={redoEventListener}
        title={formatMessage(messages.redo)}
      >
        Redo
      </Button>
    </div>
  );
}
