import { Input } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, useCallback } from 'react';

import styles from './index.module.css';

interface InputStringProps {
  label: string;
  labelPosition?: 'left' | 'top';
  minLength?: number;
  maxLength?: number;
  allowUpperChars?: boolean;
  allowSymbols?: boolean;
  allowNumbers?: boolean;
  allowSpaces?: boolean;
  pattern?: RegExp | string;
  onChange: (event: ChangeEvent<HTMLInputElement>, value: string) => void;
  value: string;
}

const defaultChars = 'abcdefghijklmnopqrstuvwxyz';
const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const symbols = '!@#$%^&*()_+-=[]{};:,./<>?';
const numbers = '0123456789';

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
  pattern,
  value,
}: InputStringProps): ReactElement {
  const chars =
    defaultChars +
    (allowUpperChars ? upperChars : '') +
    (allowNumbers ? numbers : '') +
    (allowSpaces ? ' ' : '') +
    (allowSymbols ? symbols : '');

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value;
      if (pattern) {
        onChange(event, input);
        return;
      }
      let finalValue = '';
      for (const char of input) {
        if (!chars.includes(char)) {
          continue;
        }
        finalValue += char;
      }
      onChange(event, finalValue);
    },
    [chars, onChange, pattern],
  );

  return (
    <div
      className={`${styles.root} ${labelPosition === 'left' ? styles.leftLabel : styles.topLabel}`}
    >
      <label className={styles.label}>{label}</label>
      <div className="field">
        <Input
          className={styles.input}
          maxLength={maxLength}
          minLength={minLength}
          onChange={onInputChange}
          pattern={pattern}
          value={value}
        />
      </div>
    </div>
  );
}
