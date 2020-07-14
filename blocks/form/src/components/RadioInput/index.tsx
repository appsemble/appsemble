import { FormattedMessage } from '@appsemble/preact';
import { RadioButton, RadioGroup } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, RadioField } from '../../../block';
import styles from './index.css';

type RadioInputProps = InputProps<any, RadioField>;

/**
 * An input element for a radio button.
 */
export default function RadioInput({
  disabled,
  error,
  field: { name, label, options, requirements = [] },
  onInput,
  value,
}: RadioInputProps): VNode {
  const required = Boolean(requirements?.find((req) => (req as RequiredRequirement).required));

  return (
    <RadioGroup
      className="appsemble-radio"
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      label={label}
      name={name}
      onChange={onInput}
      required={required}
      value={value}
    >
      {options.map((option) => (
        <RadioButton value={option.value} wrapperClassName={styles.choice}>
          {option.label ?? option.value}
        </RadioButton>
      ))}
    </RadioGroup>
  );
}
