import { useBlock } from '@appsemble/preact';
import { DateTimeField as DateTimeComponent } from '@appsemble/preact-components';
import { h, VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { DateField, InputProps } from '../../../block';
import { extractDate } from '../../utils/extractDate';
import { getMaxDate, getMinDate, isRequired } from '../../utils/requirements';

type DateTimeInputProps = InputProps<string, DateField>;

/**
 * An input element for a date value.
 */
export function DateInput({
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
    (event: h.JSX.TargetedEvent<HTMLInputElement>, v: string): void =>
      onChange(event, extractDate(new Date(v))),
    [onChange],
  );

  const maxDate = useMemo(() => extractDate(getMaxDate(field)), [field]);
  const minDate = useMemo(() => extractDate(getMinDate(field)), [field]);

  return (
    <DateTimeComponent
      disabled={disabled}
      error={dirty && error && utils.remap(invalidLabel, value)}
      id={name}
      label={checkboxLabel}
      maxDate={maxDate}
      minDate={minDate}
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
