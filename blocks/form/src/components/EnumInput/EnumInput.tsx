/** @jsx h */
import { Select } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import { InputProps } from '../../../block';
import styles from './EnumInput.css';

type EnumInputProps = InputProps<string>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export default function EnumInput({ field, onInput, value = '' }: EnumInputProps): VNode {
  return (
    <Select
      id={field.name}
      label={field.label || field.name}
      name={field.name}
      onInput={onInput}
      value={value}
    >
      {!value && <option className={styles.hidden}>{field.label}</option>}
      {field.enum.map(choice => (
        <option key={choice.value} value={choice.value}>
          {choice.label || choice.value}
        </option>
      ))}
    </Select>
  );
}
