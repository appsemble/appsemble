import { Icon } from '@appsemble/react-components';
import React from 'react';

import { Enum } from '../../../types';
import styles from './CheckBoxField.css';

const CheckBoxField: React.StatelessComponent<{
  value: string[];
  name: string;
  enumerator: Enum[];
  onChange: React.ChangeEventHandler<HTMLElement>;
}> = p => {
  const { enumerator, value: parentValue, ...props } = p;

  return (
    <div className={styles.container}>
      {enumerator.map(({ icon, value, label }) => (
        <div key={`${p.name}${value}`} className={styles.inputContainer}>
          <input
            checked={parentValue.includes(value)}
            className={styles.input}
            id={`${p.name}${value}`}
            type="checkbox"
            value={value}
            {...props}
          />
          <label className={styles.label} htmlFor={`${p.name}${value}`}>
            {icon && <Icon className={styles.icon} icon={icon} />}
            <span>{label || value}</span>
          </label>
        </div>
      ))}
    </div>
  );
};

export default CheckBoxField;
