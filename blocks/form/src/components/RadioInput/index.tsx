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
  field,
  onInput,
  value,
}: RadioInputProps): VNode {
  return (
    <RadioGroup
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      label={field.label}
      name={field.name}
      onChange={onInput}
      required={field.required}
      value={value}
    >
      {field.options.map((option) => (
        <RadioButton value={option.value} wrapperClassName={styles.choice}>
          {option.label ?? option.value}
        </RadioButton>
      ))}
    </RadioGroup>
  );
}
