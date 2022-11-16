import { TextArea } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, useCallback } from 'react';

import styles from './index.module.css';

interface InputStringProps {
  label: string;
  maxLength?: number;
  minLength?: number;
  allowUpperChars?: boolean;
  allowSymbols?: boolean;
  allowNumbers?: boolean;
  allowSpaces?: boolean;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>, value: string) => void;
  value: string;
}

const defaultChars = 'abcdefghijklmnopqrstuvwxyz';
const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const symbols = '!@#$%^&*()_+-=[]{};:,./<>?';
const numbers = '0123456789';

export function InputTextArea({
  allowNumbers = true,
  allowSpaces = true,
  allowSymbols = false,
  allowUpperChars = true,
  label,
  maxLength = 255,
  minLength = 1,
  onChange,
  value,
}: InputStringProps): ReactElement {
  const chars =
    defaultChars +
    (allowUpperChars ? upperChars : '') +
    (allowNumbers ? numbers : '') +
    (allowSpaces ? ' ' : '') +
    (allowSymbols ? symbols : '');

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>, input: string) => {
      let finalValue = '';
      for (const char of input) {
        if (!chars.includes(char)) {
          continue;
        }
        finalValue += char;
      }
      onChange(event, finalValue);
    },
    [chars, onChange],
  );

  return (
    <div className={`${styles.root} field ${styles.topLabel}`}>
      <label className={styles.label}>{label}</label>
      <TextArea
        className={styles.input}
        maxLength={maxLength}
        minLength={minLength}
        onChange={onInputChange}
        value={value}
      />
    </div>
  );
}
