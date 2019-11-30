/** @jsx h */
import { Select } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import { EnumField, InputProps } from '../../../block';
import styles from './EnumInput.css';

type EnumInputProps = InputProps<string, EnumField>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export default function EnumInput({ field, onInput, value = '' }: EnumInputProps): VNode {
  return (
    <Select
      iconLeft={field.icon}
      id={field.name}
      label={field.label || field.name}
      name={field.name}
      onInput={onInput}
      required={field.required}
      value={value}
    >
      {!value && (
        <option className={styles.hidden} value={null}>
          {field.label}
        </option>
      )}
      {field.enum.map(choice => (
        <option key={choice.value} value={choice.value}>
          {choice.label || choice.value}
        </option>
      ))}
    </Select>
  );
}
