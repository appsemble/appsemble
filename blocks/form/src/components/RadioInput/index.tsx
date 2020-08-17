import { FormattedMessage, useBlock } from '@appsemble/preact';
import { RadioButton, RadioGroup } from '@appsemble/preact-components';
import { h, VNode } from 'preact';

import type { InputProps, RadioField } from '../../../block';
import { isRequired } from '../../utils/isRequired';
import styles from './index.css';

type RadioInputProps = InputProps<any, RadioField>;

/**
 * An input element for a radio button.
 */
export function RadioInput({ disabled, error, field, onInput, value }: RadioInputProps): VNode {
  const { utils } = useBlock();
  const { label, name, options } = field;
  const required = isRequired(field);

  return (
    <RadioGroup
      className="appsemble-radio"
      disabled={disabled}
      error={error && <FormattedMessage id="invalid" />}
      label={utils.remap(label, value)}
      name={name}
      onChange={onInput}
      required={required}
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
