import { useBlock } from '@appsemble/preact';
import { Select } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import type { EnumField, InputProps } from '../../../block';
import isRequired from '../../utils/isRequired';
import styles from './index.css';

type EnumInputProps = InputProps<string, EnumField>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export default function EnumInput({ disabled, field, onInput, value = '' }: EnumInputProps): VNode {
  const { utils } = useBlock();

  const { enum: options, icon, label, name, placeholder } = field;
  const required = isRequired(field);

  return (
    <Select
      className="appsemble-enum"
      disabled={disabled}
      iconLeft={icon}
      id={name}
      label={utils.remap(label, value)}
      name={name}
      onInput={onInput}
      required={required}
      value={value}
    >
      {(!required || !value) && (
        <option className={classNames({ [styles.hidden]: required })} value={null}>
          {utils.remap(placeholder, {}) ?? ''}
        </option>
      )}
      {options.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {utils.remap(choice.label, value) ?? choice.value}
        </option>
      ))}
    </Select>
  );
}
