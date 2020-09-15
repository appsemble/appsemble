import { useBlock } from '@appsemble/preact';
import { Calendar } from '@appsemble/preact-components';
import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { DateTimeField, InputProps } from '../../../block';
import { isRequired } from '../../utils/isRequired';

type DateTimeInputProps = InputProps<string, DateTimeField>;

/**
 * An input element for a date/time value.
 */
export function DateTimeInput({
  disabled,
  error,
  field,
  onInput,
  value = null,
}: DateTimeInputProps): VNode {
  const {
    parameters: { invalidLabel = 'This value is invalid', optionalLabel },
    utils,
  } = useBlock();
  const { label, name, placeholder, readOnly, tag } = field;

  const checkboxLabel = utils.remap(label, value);

  const required = isRequired(field);

  const handleChange = useCallback(
    (event: Event, dates: Date[]) => {
      onInput(event, dates[0].toISOString());
    },
    [onInput],
  );

  return (
    <Calendar
      disabled={disabled}
      enableTime
      error={error && utils.remap(invalidLabel, value)}
      id={name}
      label={checkboxLabel}
      name={name}
      onChange={handleChange}
      optionalLabel={utils.remap(optionalLabel, value)}
      placeholder={utils.remap(placeholder, value)}
      readOnly={readOnly}
      required={required}
      tag={utils.remap(tag, value)}
    />
  );
}
