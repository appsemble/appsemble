import { Dropdown } from '@appsemble/react-components';
import { ReactElement, useCallback } from 'react';

import styles from './index.module.css';
import { ListItem } from './ListItem/index.js';

interface InputStringProps {
<<<<<<< HEAD
  label?: string;
=======
  label: string;
>>>>>>> 84b170508 (Add general tab)
  labelPosition?: 'left' | 'top';
  onChange: (index: number) => void;
  value: string;
  options: readonly string[];
<<<<<<< HEAD
  size?: 'large' | 'medium' | 'normal' | 'small';
=======
>>>>>>> 84b170508 (Add general tab)
}

export function InputList({
  label,
<<<<<<< HEAD
  labelPosition = 'top',
  onChange,
  options,
  size = 'normal',
=======
  labelPosition = 'left',
  onChange,
  options,
>>>>>>> 84b170508 (Add general tab)
  value,
}: InputStringProps): ReactElement {
  const onDropdownChange = useCallback(
    (index: number) => {
      onChange(index);
    },
    [onChange],
  );

  let valueString;
  switch (size) {
    case 'large':
      valueString = value.length > 15 ? `${value.slice(0, 15)}...` : value;
      break;
    case 'medium':
      valueString = value.length > 10 ? `${value.slice(0, 10)}...` : value;
      break;
    case 'small':
      valueString = value.length > 7 ? `${value.slice(0, 7)}...` : value;
      break;
    default:
      valueString = value;
      break;
  }

  if (!label) {
    return (
      <div className={`${styles.root} field`}>
        <Dropdown className={styles.dropDown} label={<span className="px-1">{valueString}</span>}>
          {options.map((option, index) => (
            <ListItem index={index} key={option} onChange={onDropdownChange} value={option} />
          ))}
        </Dropdown>
      </div>
    );
  }

  return (
    <div
      className={`${styles.root} field ${
        labelPosition === 'left' ? styles.leftLabel : styles.topLabel
      }`}
    >
      <label className={styles.label}>{label}</label>
      <Dropdown className={styles.dropDown} label={<span className="px-1">{valueString}</span>}>
        {options.map((option, index) => (
          <ListItem index={index} key={option} onChange={onDropdownChange} value={option} />
        ))}
      </Dropdown>
    </div>
  );
}
