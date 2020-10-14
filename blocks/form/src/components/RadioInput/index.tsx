import { useBlock } from '@appsemble/preact';
import { RadioButton, RadioGroup } from '@appsemble/preact-components';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { InputProps, RadioField } from '../../../block';
import { isRequired } from '../../utils/requirements';
import styles from './index.css';

type RadioInputProps = InputProps<any, RadioField>;

/**
 * An input element for a radio button.
 */
export function RadioInput({
  dirty,
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

  const handleOnChange = useCallback(
    (event: Event, index: any) => {
      onChange(event, options[index].value);
    },
    [onChange, options],
  );

  return (
    <RadioGroup
      className="appsemble-radio"
      disabled={disabled}
      error={dirty && error && utils.remap(invalidLabel, value)}
      label={utils.remap(label, value)}
      name={name}
      onChange={handleOnChange}
      optionalLabel={utils.remap(optionalLabel, value)}
      required={required}
      tag={utils.remap(tag, value)}
      value={options.findIndex((o) => o.value === value)}
    >
      {options.map((option, index) => (
        <RadioButton key={option.value} value={index} wrapperClassName={styles.choice}>
          {utils.remap(option.label, {}) ?? option.value}
        </RadioButton>
      ))}
    </RadioGroup>
  );
}
