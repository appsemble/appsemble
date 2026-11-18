import classNames from 'classnames';
import { type ComponentType, type VNode } from 'preact';

import styles from './index.module.css';
import { Message } from '../Message/index.js';
import { useSimpleForm } from '../SimpleForm/index.js';

interface SimpleFormErrorProps {
  readonly children: ComponentType<{ error: Error }>;
}

export function SimpleFormError({ children: Children }: SimpleFormErrorProps): VNode {
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
