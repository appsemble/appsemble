import { useBlock } from '@appsemble/preact';
import { DateTimeField } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type JSX, type VNode } from 'preact';
import { useCallback, useMemo } from 'preact/hooks';

import { type DateField, type InputProps } from '../../../block.js';
import { useLocale } from '../../hooks/useLocale.js';
import { extractDate } from '../../utils/extractDate.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { getDisabledDays, getMaxDate, getMinDate, isRequired } from '../../utils/requirements.js';

type DateTimeInputProps = InputProps<string, DateField>;

/**
 * An input element for a date value.
 */
export function DateInput({
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
  const { help, inline, label, name, placeholder, tag } = field;

  const value = getValueByNameSequence(name, formValues);
  const dateLabel = utils.remap(label, value) as string;
  const confirmLabel = utils.formatMessage('confirmLabel');

  const required = isRequired(field, utils, formValues);

  const handleOnChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>, v: string): void =>
      onChange(event, extractDate(new Date(v))),
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
  const disable = useMemo(() => getDisabledDays(field), [field]);

  const locale = useLocale(field);

  return (
    <DateTimeField
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
      error={dirty ? error : null}
      errorLinkRef={errorLinkRef}
      help={utils.remap(help, value) as string}
      icon={field.icon}
      id={name}
      inline={inline}
      label={dateLabel ?? name}
      locale={locale}
      maxDate={maxDate}
      minDate={minDate}
      name={name}
      onChange={handleOnChange}
      optionalLabel={utils.formatMessage('optionalLabel')}
      placeholder={(utils.remap(placeholder, value) as string) || dateLabel || name}
      readOnly={readOnly}
      required={required}
      tag={utils.remap(tag, value) as string}
      value={value as string}
    />
  );
}
