import 'flatpickr/dist/flatpickr.css';

import flatpickr from 'flatpickr';
import { ComponentProps, h, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { FormComponent, Input, SharedFormComponentProps } from '..';

type DateTimeFieldProps = SharedFormComponentProps &
  Omit<ComponentProps<typeof Input>, 'error'> &
  Pick<flatpickr.Options.Options, 'enableTime' | 'mode'> & {
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
    onChange?: (event: h.JSX.TargetedEvent<HTMLInputElement>, value: Date | string) => void;

    /**
     * The current value as a Date object or an ISO8601 formatted string.
     */
    value: Date | string;
  };

export function DateTimeField({
  className,
  enableTime,
  error,
  help,
  icon,
  iso,
  label,
  mode = 'single',
  name,
  onChange,
  optionalLabel,
  required,
  tag,
  value,
  id = name,
  ...props
}: DateTimeFieldProps): VNode {
  const wrapper = useRef<HTMLDivElement>();
  const [picker, setPicker] = useState<flatpickr.Instance>(null);

  const handleChange = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement>) => {
      if (picker) {
        onChange(event, iso ? picker.selectedDates[0].toISOString() : picker.selectedDates[0]);
      }
    },
    [onChange, picker, iso],
  );

  useEffect(() => {
    const p = flatpickr(wrapper.current, {
      enableTime,
      mode,
      time_24hr: true,
      wrap: true,
    });

    setPicker(p);

    return p.destroy;
  }, [enableTime, mode]);

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
      <Input
        {...props}
        className="is-fullwidth"
        data-input
        id={id}
        name={name}
        onChange={handleChange}
      />
    </FormComponent>
  );
}
