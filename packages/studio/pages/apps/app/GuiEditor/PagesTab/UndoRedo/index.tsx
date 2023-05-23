import { Button } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';

interface UndoRedoProps {
  getIndex: () => number;
  getStackSize: () => number;
  redoEventListener: () => void;
  undoEventListener: () => void;
}

export function UndoRedo({
  getIndex,
  getStackSize,
  redoEventListener,
  undoEventListener,
}: UndoRedoProps): ReactElement {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.undoredoContainer}>
      <Button
        className={styles.undoButton}
        disabled={getIndex() < 1}
        icon="rotate-left"
        onClick={undoEventListener}
        title={formatMessage(messages.undo)}
      />
      <Button
        className={styles.redoButton}
        disabled={getIndex() >= getStackSize()}
        icon="rotate-right"
        onClick={redoEventListener}
        title={formatMessage(messages.redo)}
      />
    </div>
  );
}
