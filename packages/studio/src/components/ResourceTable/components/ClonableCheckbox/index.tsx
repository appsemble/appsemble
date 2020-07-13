import { useToggle } from '@appsemble/react-components';
import React, { ReactElement, useCallback } from 'react';

import styles from './index.css';

interface ClonableCheckboxProps {
  checked: boolean;
  id: string;
  onChange: () => void;
}

export default function ClonableCheckbox({
  checked,
  id,
  onChange,
}: ClonableCheckboxProps): ReactElement {
  const { disable, enable, enabled } = useToggle();
  const handleChange = useCallback(() => {
    enable();
    onChange();
    disable();
  }, [onChange, enable, disable]);

  return (
    <div className={`field ${styles.field}`}>
      <input
        checked={checked}
        className="is-checkradio"
        disabled={enabled}
        id={id}
        onChange={handleChange}
        type="checkbox"
      />
      <label className={styles.label} htmlFor={id} />
    </div>
  );
}
