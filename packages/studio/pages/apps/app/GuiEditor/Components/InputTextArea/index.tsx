import { TextArea } from '@appsemble/react-components';
import { type ChangeEvent, type ReactElement, useCallback } from 'react';

import styles from './index.module.css';
import { getAllowedChars, getCheckedString } from '../../../../../../utils/stringValidator.js';

interface InputStringProps {
  readonly label: string;
  readonly maxLength?: number;
  readonly minLength?: number;
  readonly allowUpperChars?: boolean;
  readonly allowSymbols?: boolean;
  readonly allowNumbers?: boolean;
  readonly allowSpaces?: boolean;
  readonly onChange: (event: ChangeEvent<HTMLTextAreaElement>, value: string) => void;
  readonly value: string;
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
