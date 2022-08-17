import classNames from 'classnames';
import { ComponentType, ReactElement } from 'react';

import { Message, useSimpleForm } from '../index.js';
import styles from './index.module.css';

interface SimpleFormErrorProps {
  children: ComponentType<{ error: Error }>;
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
