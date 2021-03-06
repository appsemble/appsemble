import { FormattedMessage, useBlock } from '@appsemble/preact';
import { DateTimeField as DateTimeComponent } from '@appsemble/preact-components';
import { JSX, VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { DateTimeField, InputProps } from '../../../block';
import { useLocale } from '../../hooks/useLocale';
import { extractDate } from '../../utils/extractDate';
import { getMaxDate, getMinDate, isRequired } from '../../utils/requirements';

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
  const { utils } = useBlock();
  const { label, name, placeholder, readOnly, tag } = field;

  const dateTimeLabel = utils.remap(label, value);

  const required = isRequired(field);

  const handleOnChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement, Event>, v: string): void => onChange(event, v),
    [onChange],
  );

  const maxDate = useMemo(() => extractDate(getMaxDate(field, utils)), [field, utils]);
  const minDate = useMemo(() => extractDate(getMinDate(field, utils)), [field, utils]);

  const locale = useLocale(field);

  return (
    <DateTimeComponent
      disabled={disabled}
      enableTime={field.type === 'date-time'}
      error={dirty && error}
      id={name}
      iso
      label={dateTimeLabel}
      locale={locale}
      maxDate={maxDate}
      minDate={minDate}
      name={name}
      onChange={handleOnChange}
      optionalLabel={<FormattedMessage id="optionalLabel" />}
      placeholder={utils.remap(placeholder, value) || dateTimeLabel || name}
      readOnly={readOnly}
      required={required}
      tag={utils.remap(tag, value)}
      value={value}
    />
  );
}
