import { Select } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import type { EnumField, InputProps, RequiredRequirement } from '../../../block';
import styles from './index.css';

type EnumInputProps = InputProps<string, EnumField>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export default function EnumInput({
  disabled,
  field: { icon, name, label, placeholder, enum: options, requirements = [] },
  onInput,
  value = '',
}: EnumInputProps): VNode {
  const required = Boolean(requirements?.find((req) => (req as RequiredRequirement).required));

  return (
    <Select
      className="appsemble-enum"
      disabled={disabled}
      iconLeft={icon}
      id={name}
      label={label}
      name={name}
      onInput={onInput}
      required={required}
      value={value}
    >
      {(!required || !value) && (
        <option className={classNames({ [styles.hidden]: required })} value={null}>
          {placeholder ?? ''}
        </option>
      )}
      {options.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label ?? choice.value}
        </option>
      ))}
    </Select>
  );
}
