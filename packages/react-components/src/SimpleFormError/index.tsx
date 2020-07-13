import classNames from 'classnames';
import React, { ComponentType, ReactElement } from 'react';

import Message from '../Message';
import { useSimpleForm } from '../SimpleForm';
import styles from './index.css';

interface SimpleFormErrorProps {
  children: ComponentType<{ error: Error }>;
}

export default function SimpleFormError({
  children: Children,
}: SimpleFormErrorProps): ReactElement {
  const { submitError } = useSimpleForm();

  return (
    <Message
      className={classNames(styles.root, { [`${styles.hidden} mb-0`]: !submitError })}
      color="danger"
    >
      {submitError && <Children error={submitError} />}
    </Message>
  );
}
