import { Icon } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, ReactNode, useCallback } from 'react';

import styles from './index.css';

interface IconPickerProps {
  children: ReactNode;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>, value: File) => void;
}

export function IconPicker({ children, name, onChange }: IconPickerProps): ReactElement {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event, event.currentTarget.files[0]);
    },
    [onChange],
  );

  return (
    <div className={styles.root}>
      <div className={styles.wrapper}>
        {children}
        <div className={`has-text-white has-background-black is-flex ${styles.icon}`}>
          <input className={styles.input} name={name} onChange={handleChange} type="file" />
          <Icon icon="image" size="large" />
        </div>
      </div>
    </div>
  );
}
