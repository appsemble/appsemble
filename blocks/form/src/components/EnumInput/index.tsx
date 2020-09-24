import { useBlock } from '@appsemble/preact';
import { SelectField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h, VNode } from 'preact';

import type { EnumField, InputProps } from '../../../block';
import { isRequired } from '../../utils/isRequired';
import styles from './index.css';

type EnumInputProps = InputProps<string, EnumField>;

/**
 * Render a select box which offers choices a JSON schema enum.
 */
export function EnumInput({ disabled, field, name, onChange, value }: EnumInputProps): VNode {
  const {
    parameters: { optionalLabel },
    utils,
  } = useBlock();

  const { enum: options, icon, label, placeholder, tag } = field;
  const required = isRequired(field);

  return (
    <SelectField
      className="appsemble-enum"
      disabled={disabled}
      icon={icon}
      label={utils.remap(label, value)}
      name={name}
      onChange={onChange}
      optionalLabel={utils.remap(optionalLabel, value)}
      required={required}
      tag={utils.remap(tag, value)}
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
    </SelectField>
  );
}
