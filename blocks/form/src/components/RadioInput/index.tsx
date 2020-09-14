import { useBlock } from '@appsemble/preact';
import { RadioButton, RadioGroup } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, RadioField } from '../../../block';
import { isRequired } from '../../utils/isRequired';
import styles from './index.css';

type RadioInputProps = InputProps<any, RadioField>;

/**
 * An input element for a radio button.
 */
export function RadioInput({
  disabled,
  error,
  field,
  name,
  onChange,
  value,
}: RadioInputProps): VNode {
  const {
    parameters: { invalidLabel = 'This value is invalid', optionalLabel },
    utils,
  } = useBlock();
  const { label, options, tag } = field;
  const required = isRequired(field);

  return (
    <RadioGroup
      className="appsemble-radio"
      disabled={disabled}
      error={error && utils.remap(invalidLabel, value)}
      label={utils.remap(label, value)}
      name={name}
      onChange={onChange}
      optionalLabel={utils.remap(optionalLabel, value)}
      required={required}
      tag={utils.remap(tag, value)}
      value={value}
    >
      {options.map((option) => (
        <RadioButton
          key={String(option.value)}
          value={option.value}
          wrapperClassName={styles.choice}
        >
          {utils.remap(option.label, {}) ?? option.value}
        </RadioButton>
      ))}
    </RadioGroup>
  );
}
