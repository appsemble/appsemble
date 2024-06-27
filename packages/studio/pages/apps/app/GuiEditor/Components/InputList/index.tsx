import { Dropdown } from '@appsemble/react-components';
import classNames from 'classnames';
import { type ReactNode, useCallback } from 'react';

import styles from './index.module.css';
import { ListItem } from './ListItem/index.js';

interface InputStringProps {
  readonly className?: string;
  readonly hideLabel?: boolean;
  readonly isRight?: boolean;
  readonly label?: string;
  readonly labelPosition?: 'left' | 'top';
  readonly onChange: (index: number) => void;
  readonly options: readonly string[];
  readonly size?: 'large' | 'medium' | 'normal' | 'small';
  readonly value: string;
}

export function DropDownLabel(size: string, value: string): ReactNode {
  const val = value;
  let valueString;
  switch (size) {
    case 'large':
      valueString = val.length > 15 ? `${val.slice(0, 15)}...` : val;
      break;
    case 'medium':
      valueString = val.length > 10 ? `${val.slice(0, 10)}...` : val;
      break;
    case 'small':
      valueString = val.length > 7 ? `${val.slice(0, 7)}...` : val;
      break;
    default:
      valueString = val;
      break;
  }
  return <span className="px-1">{valueString}</span>;
}

export function InputList({
  className,
  hideLabel,
  isRight,
  label,
  labelPosition = 'top',
  onChange,
  options,
  size = 'normal',
  value,
}: InputStringProps): ReactNode {
  const onDropdownChange = useCallback(
    (index: number) => {
      onChange(index);
    },
    [onChange],
  );

  if (!label) {
    return (
      <div className={`${styles.root} ${className} field`}>
        <Dropdown className={String(isRight ? 'is-right' : '')} label={DropDownLabel(size, value)}>
          {options.map((option, index) => (
            <ListItem index={index} key={option} onChange={onDropdownChange} value={option} />
          ))}
        </Dropdown>
      </div>
    );
  }

  return (
    <div
      className={`${styles.root} ${className} field ${
        labelPosition === 'left' ? styles.leftLabel : styles.topLabel
      }`}
    >
      <label
        className={classNames(String(styles.label), {
          [styles.hide]: hideLabel,
        })}
        id="inputListLabel"
      >
        {label}
      </label>
      <Dropdown className={String(isRight ? 'is-right' : '')} label={DropDownLabel(size, value)}>
        {options.map((option, index) => (
          <ListItem index={index} key={option} onChange={onDropdownChange} value={option} />
        ))}
      </Dropdown>
    </div>
  );
}
