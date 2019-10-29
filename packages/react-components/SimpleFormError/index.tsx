import classNames from 'classnames';
import React from 'react';

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
    <div
      className={classNames('message is-danger', styles.root, { [styles.hidden]: !submitError })}
    >
      <div className="message-body">{submitError && <Children error={submitError} />}</div>
    </div>
  );
}
