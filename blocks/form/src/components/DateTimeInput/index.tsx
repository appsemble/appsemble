import { useBlock } from '@appsemble/preact';
import { DateTimeField as DateTimeComponent } from '@appsemble/preact-components';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { DateTimeField, InputProps } from '../../../block';
import { isRequired } from '../../utils/requirements';

type DateTimeInputProps = InputProps<string, DateTimeField>;

/**
 * An input element for a date/time value.
 */
export function DateTimeInput({
  dirty,
  disabled,
  error,
  field,
  onChange,
  value = null,
}: DateTimeInputProps): VNode {
  const {
    parameters: { invalidLabel = 'This value is invalid', optionalLabel },
    utils,
  } = useBlock();
  const { label, name, placeholder, readOnly, tag } = field;

  const checkboxLabel = utils.remap(label, value);

  const required = isRequired(field);

  const handleOnChange = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement, Event>, v: string): void => {
      if (field.type === 'date') {
        return onChange(event, v.split('T')[0]);
      }

      return onChange(event, v);
    },
    [field.type, onChange],
  );

  return (
    <DateTimeComponent
      disabled={disabled}
      enableTime={field.type === 'date-time'}
      error={dirty && error && utils.remap(invalidLabel, value)}
      id={name}
      iso
      label={checkboxLabel}
      name={name}
      onChange={handleOnChange}
      optionalLabel={utils.remap(optionalLabel, value)}
      placeholder={utils.remap(placeholder, value)}
      readOnly={readOnly}
      required={required}
      tag={utils.remap(tag, value)}
      value={value}
    />
  );
}
