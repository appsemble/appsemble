import { Icon } from '@appsemble/react-components';
import React from 'react';

import { Enum } from '../../../types';
import styles from './CheckBoxField.css';

interface CheckBoxFieldProps {
  value: string[];
  name: string;
  enumerator: Enum[];
  onChange: React.ChangeEventHandler<HTMLElement>;
}

export default function CheckBoxField({
  enumerator,
  name,
  value: parentValue,
  ...props
}: CheckBoxFieldProps): React.ReactElement {
  return (
    <div className={styles.container}>
      {enumerator.map(({ icon, value, label }) => (
        <div key={`${name}${value}`} className={styles.inputContainer}>
          <input
            checked={parentValue.includes(value)}
            className={styles.input}
            id={`${name}${value}`}
            name={name}
            type="checkbox"
            value={value}
            {...props}
          />
          <label className={styles.label} htmlFor={`${name}${value}`}>
            {icon && <Icon icon={icon} />}
            <span>{label || value}</span>
          </label>
        </div>
      ))}
    </div>
  );
}
