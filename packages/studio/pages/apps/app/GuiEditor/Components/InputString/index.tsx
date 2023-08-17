import { Input } from '@appsemble/react-components';
import { type ChangeEvent, type ReactElement, useCallback } from 'react';

import styles from './index.module.css';
import { getAllowedChars, getCheckedString } from '../../../../../../utils/stringValidator.js';

interface InputStringProps {
  readonly label?: string;
  readonly labelPosition?: 'left' | 'top';
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly allowUpperChars?: boolean;
  readonly allowSymbols?: boolean;
  readonly allowNumbers?: boolean;
  readonly allowSpaces?: boolean;
  readonly pattern?: RegExp;
  readonly onChange?: (event: ChangeEvent<HTMLInputElement>, value: string) => void;
  readonly value: string;
  readonly readonly?: boolean;
  readonly onClick?: (value: string) => void;
}

export function InputString({
  allowNumbers = true,
  allowSpaces = true,
  allowSymbols = false,
  allowUpperChars = true,
  label,
  labelPosition = 'top',
  maxLength = 32,
  minLength = 1,
  onChange,
  onClick,
  pattern,
  readonly = false,
  value,
}: InputStringProps): ReactElement {
  const charsRegex = getAllowedChars(allowSpaces, allowSymbols, allowNumbers, allowUpperChars);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value;
      if (pattern?.test(input) || input === '') {
        onChange(event, input);
      }
      const finalValue = getCheckedString(charsRegex, input);
      onChange(event, finalValue);
    },
    [charsRegex, onChange, pattern],
  );

  const onClickInput = useCallback(() => {
    if (onClick) {
      onClick(value);
    }
  }, [onClick, value]);

  if (!label) {
    return (
      <div>
        <Input
          className={styles.input}
          maxLength={maxLength}
          minLength={minLength}
          onChange={onInputChange}
          onClick={onClickInput}
          readOnly={readonly}
          value={value}
        />
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
      <Input
        className={styles.input}
        maxLength={maxLength}
        minLength={minLength}
        onChange={onInputChange}
        onClick={onClickInput}
        readOnly={readonly}
        value={value}
      />
    </div>
  );
}
