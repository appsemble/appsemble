import { Input } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, useCallback } from 'react';

import getAllowedChars from '../../Utils/getAllowedChars.js';
import getCheckedString from '../../Utils/getCheckedString.js';
import styles from './index.module.css';

interface InputStringProps {
  label?: string;
  labelPosition?: 'left' | 'top';
  minLength?: number;
  maxLength?: number;
  allowUpperChars?: boolean;
  allowSymbols?: boolean;
  allowNumbers?: boolean;
  allowSpaces?: boolean;
<<<<<<< HEAD
  pattern?: RegExp;
=======
  pattern?: RegExp | string;
>>>>>>> 9aa72fe2a (Add renaming roles changing all references)
  onChange?: (event: ChangeEvent<HTMLInputElement>, value: string) => void;
  value: string;
  readonly?: boolean;
  onClick?: (value: string) => void;
}

export function InputString({
  allowNumbers = true,
  allowSpaces = true,
  allowSymbols = false,
  allowUpperChars = true,
  label,
  labelPosition = 'left',
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
      if (pattern) {
        if (pattern.test(input) || input === '') {
          onChange(event, input);
        }
        return;
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
      <Input
        className={styles.input}
        maxLength={maxLength}
        minLength={minLength}
        onChange={onInputChange}
        onClick={onClickInput}
        readOnly={readonly}
        value={value}
      />
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
