import classNames from 'classnames';
import { type ComponentType, type ReactElement } from 'react';

import styles from './index.module.css';
import { Message, useSimpleForm } from '../index.js';

interface SimpleFormErrorProps {
  readonly children: ComponentType<{ error: Error }>;
}

export function SimpleFormError({ children: Children }: SimpleFormErrorProps): ReactElement {
  const { submitError } = useSimpleForm();

  return (
    <Message
      className={classNames(styles.root, { [`${styles.hidden} mb-0`]: !submitError })}
      color="danger"
    >
      {submitError ? <Children error={submitError} /> : null}
    </Message>
  );
}
