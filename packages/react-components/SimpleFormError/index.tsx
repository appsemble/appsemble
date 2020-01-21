import classNames from 'classnames';
import React from 'react';

import Message from '../Message';
import { useSimpleForm } from '../SimpleForm';
import styles from './SimpleFormError.css';

interface SimpleFormErrorProps {
  children: React.ComponentType<{ error: Error }>;
}

export default function SimpleFormError({
  children: Children,
}: SimpleFormErrorProps): React.ReactElement {
  const { submitError } = useSimpleForm();

  return (
    <Message className={classNames(styles.root, { [styles.hidden]: !submitError })} color="danger">
      {submitError && <Children error={submitError} />}
    </Message>
  );
}
