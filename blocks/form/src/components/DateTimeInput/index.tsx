import { useBlock } from '@appsemble/preact';
import { DateTimeField as DateTimeComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { JSX, VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { DateTimeField, InputProps } from '../../../block.js';
import { useLocale } from '../../hooks/useLocale.js';
import { extractDate } from '../../utils/extractDate.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import {
  getDisabledDays,
  getMaxDate,
  getMaxTime,
  getMinDate,
  getMinTime,
  isRequired,
} from '../../utils/requirements.js';

type DateTimeInputProps = InputProps<string, DateTimeField>;

/**
 * An input element for a date/time value.
 */
export function DateTimeInput({
  className,
  dirty,
  disabled,
  error,
  field,
  formValues = null,
  onChange,
  readOnly,
}: DateTimeInputProps): VNode {
  const { utils } = useBlock();
  const { label, name, placeholder, tag } = field;
  const value = getValueByNameSequence(name, formValues);
  const required = isRequired(field);

  const dateTimeLabel = utils.remap(label, value) as string;
  const confirmLabel = utils.formatMessage('confirmLabel');

  const handleOnChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement, Event>, v: string): void => onChange(event, v),
    [onChange],
  );

  const maxDate = useMemo(() => extractDate(getMaxDate(field, utils)), [field, utils]);
  const minDate = useMemo(() => extractDate(getMinDate(field, utils)), [field, utils]);
  const minTime = useMemo(() => getMinTime(field), [field]);
  const maxTime = useMemo(() => getMaxTime(field), [field]);
  const disable = useMemo(() => getDisabledDays(field), [field]);

  const locale = useLocale(field);

  return (
    <DateTimeComponent
      className={classNames(className)}
      confirm={field.confirm}
      confirmLabel={confirmLabel}
      // @ts-expect-error There’s a mismatch between the `Remapper` type in the shared types and
      // the SDK.
      dateFormat={field.dateFormat}
      disable={disable}
      disabled={disabled}
      enableTime={field.type === 'date-time'}
      error={dirty ? error : null}
      icon={field.icon}
      id={name}
      iso
      label={dateTimeLabel}
      locale={locale}
      maxDate={maxDate}
      maxTime={maxTime}
      minDate={minDate}
      minTime={minTime}
      minuteIncrement={field.minuteIncrement}
      name={name}
      onChange={handleOnChange}
      optionalLabel={utils.formatMessage('optionalLabel')}
      placeholder={(utils.remap(placeholder, value) as string) || dateTimeLabel || name}
      readOnly={readOnly}
      required={required}
      tag={utils.remap(tag, value) as string}
      value={value as string}
    />
  );
}
