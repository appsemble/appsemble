import { useBlock } from '@appsemble/preact';
import { DateTimeField as DateTimeComponent } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type JSX, type VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { type DateTimeField, type InputProps } from '../../../block.js';
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
  errorLinkRef,
  field,
  formValues = {},
  onChange,
  readOnly,
}: DateTimeInputProps): VNode {
  const { utils } = useBlock();
  const { help, label, name, placeholder, tag } = field;
  const value = getValueByNameSequence(name, formValues);
  const required = isRequired(field, utils, formValues);

  const dateTimeLabel = (utils.remap(label, value) as string) ?? name;
  const confirmLabel = utils.formatMessage('confirmLabel');

  const handleOnChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement, Event>, v: string): void => onChange(event, v),
    [onChange],
  );

  const maxDate = useMemo(
    () => extractDate(getMaxDate(field, utils, formValues)),
    [field, utils, formValues],
  );
  const minDate = useMemo(
    () => extractDate(getMinDate(field, utils, formValues)),
    [field, utils, formValues],
  );
  const minTime = useMemo(() => getMinTime(field), [field]);
  const maxTime = useMemo(() => getMaxTime(field), [field]);
  const disable = useMemo(() => getDisabledDays(field), [field]);

  const locale = useLocale(field);

  return (
    <DateTimeComponent
      allowInput={field.allowInput}
      altFormat={field.altFormat}
      altInput={field.altInput}
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
      errorLinkRef={errorLinkRef}
      help={utils.remap(help, value) as string}
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
