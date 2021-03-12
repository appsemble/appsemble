import { FormattedMessage, useBlock } from '@appsemble/preact';
import { InputField } from '@appsemble/preact-components';
import { VNode } from 'preact';

import { InputProps, NumberField } from '../../../block';
import { getMax, getMin, getStep, isRequired } from '../../utils/requirements';

type NumberInputProps = InputProps<number, NumberField>;

/**
 * An input element for a number type schema.
 */
export function NumberInput({
  dirty,
  disabled,
  error,
  field,
  name,
  onChange,
  value,
}: NumberInputProps): VNode {
  const { utils } = useBlock();
  const { icon, label, placeholder, readOnly, tag } = field;

  return (
    <InputField
      className="appsemble-number"
      disabled={disabled}
      error={dirty && error}
      icon={icon}
      label={label}
      max={getMax(field)}
      min={getMin(field)}
      name={name}
      onChange={onChange}
      optionalLabel={<FormattedMessage id="optionalLabel" />}
      placeholder={utils.remap(placeholder, value) || utils.remap(label, value) || field.name}
      readOnly={readOnly}
      required={isRequired(field)}
      step={getStep(field)}
      tag={utils.remap(tag, value)}
      type="number"
      value={value}
    />
  );
}
