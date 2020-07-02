import { Icon } from '@appsemble/react-components';
import React, { ChangeEventHandler, ReactElement } from 'react';

import type { Enum } from '../../../block';
import styles from './index.css';

interface CheckBoxFieldProps {
  value: string[];
  name: string;
  enumerator: Enum[];
  onChange: ChangeEventHandler<HTMLElement>;
}

export default function CheckBoxField({
  enumerator,
  name,
  value: parentValue,
  ...props
}: CheckBoxFieldProps): ReactElement {
  return (
    <div className={`${styles.container} is-flex`}>
      {enumerator.map(({ icon, label, value }) => (
        <div key={`${name}${value}`} className={styles.inputContainer}>
          <input
            checked={parentValue.includes(value)}
            className="is-hidden"
            id={`${name}${value}`}
            name={name}
            type="checkbox"
            value={value}
            {...props}
          />
          <label className={`${styles.label} px-3 py-3`} htmlFor={`${name}${value}`}>
            {icon && <Icon icon={icon} />}
            <span>{label ?? value}</span>
          </label>
        </div>
      ))}
    </div>
  );
}
