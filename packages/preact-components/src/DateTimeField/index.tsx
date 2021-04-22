import 'flatpickr/dist/flatpickr.css';

import flatpickr from 'flatpickr';
import { ComponentProps, JSX, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { FormComponent, Input, SharedFormComponentProps } from '..';

type DateTimeFieldProps = Omit<ComponentProps<typeof Input>, 'error'> &
  Pick<
    flatpickr.Options.Options,
    'enableTime' | 'locale' | 'maxDate' | 'minDate' | 'mode' | 'noCalendar'
  > &
  SharedFormComponentProps & {
    /**
     * If true, the value is emitted as an ISO8601 formatted string. Otherwise, a Date object is
     * used.
     */
    iso?: boolean;

    /**
     * The change handler.
     *
     * @param event - An object with the properties `target` and `currentTarget` set to the input
     * element, to emulate an event.
     * @param value - The value that was selected.
     */
    onChange?: (event: JSX.TargetedEvent<HTMLInputElement>, value: Date | string) => void;

    /**
     * The current value as a Date object or an ISO8601 formatted string.
     */
    value: Date | string;
  };

export function DateTimeField({
  className,
  disabled,
  enableTime,
  noCalendar,
  error,
  help,
  icon,
  iso,
  label,
  locale,
  mode = 'single',
  name,
  onChange,
  optionalLabel,
  required,
  tag,
  value,
  minDate,
  maxDate,
  id = name,
  ...props
}: DateTimeFieldProps): VNode {
  const wrapper = useRef<HTMLDivElement>();
  const positionElement = useRef<HTMLDivElement>();
  const [picker, setPicker] = useState<flatpickr.Instance>(null);

  const handleChange = useCallback(
    (event: JSX.TargetedEvent<HTMLInputElement>) => {
      if (picker) {
        onChange(event, iso ? picker.selectedDates[0].toISOString() : picker.selectedDates[0]);
      }
    },
    [onChange, picker, iso],
  );

  useEffect(() => {
    if (disabled) {
      return;
    }

    const p = flatpickr(wrapper.current, {
      appendTo: wrapper.current,
      enableTime,
      locale,
      noCalendar,
      mode,
      positionElement: positionElement.current,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      time_24hr: true,
      wrap: true,
      minDate,
      maxDate,
    });

    setPicker(p);

    return () => {
      p.destroy();
      setPicker(null);
    };
  }, [disabled, enableTime, locale, maxDate, minDate, mode, noCalendar]);

  useEffect(() => {
    picker?.setDate(value);
  }, [picker, value]);

  return (
    <FormComponent
      className={className}
      error={error}
      help={help}
      icon={icon}
      id={id}
      label={label}
      optionalLabel={optionalLabel}
      ref={wrapper}
      required={required}
      tag={tag}
    >
      <div ref={positionElement} />
      <Input
        {...props}
        className="is-fullwidth"
        data-input
        disabled={disabled}
        id={id}
        name={name}
        onChange={handleChange}
      />
    </FormComponent>
  );
}
