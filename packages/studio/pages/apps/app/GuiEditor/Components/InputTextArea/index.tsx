import { TextArea } from '@appsemble/react-components';
import { ChangeEvent, ReactElement, useCallback } from 'react';

import getAllowedChars from '../../Utils/getAllowedChars.js';
import getCheckedString from '../../Utils/getCheckedString.js';
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
  const charsRegex = getAllowedChars(allowSpaces, allowSymbols, allowNumbers, allowUpperChars);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>, input: string) => {
      const finalValue = getCheckedString(charsRegex, input);
      onChange(event, finalValue);
    },
    [charsRegex, onChange],
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
