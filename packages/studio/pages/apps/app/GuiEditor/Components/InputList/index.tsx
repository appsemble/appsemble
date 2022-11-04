import { Dropdown } from '@appsemble/react-components';
import { ReactElement, useCallback } from 'react';

import styles from './index.module.css';
import { ListItem } from './ListItem/index.js';

interface InputStringProps {
  label: string;
  labelPosition?: 'left' | 'top';
  onChange: (index: number) => void;
  value: string;
  options: readonly string[];
}

export function InputList({
  label,
  labelPosition = 'left',
  onChange,
  options,
  value,
}: InputStringProps): ReactElement {
  const onDropdownChange = useCallback(
    (index: number) => {
      onChange(index);
    },
    [onChange],
  );

  return (
    <div
      className={`${styles.root} ${labelPosition === 'left' ? styles.leftLabel : styles.topLabel}`}
    >
      <label className={styles.label}>{label}</label>
      <div className="field">
        <Dropdown className={styles.dropDown} label={<span className="px-1">{value}</span>}>
          {options.map((option, index) => (
            <ListItem index={index} key={option} onChange={onDropdownChange} value={option} />
          ))}
        </Dropdown>
      </div>
    </div>
  );
}
