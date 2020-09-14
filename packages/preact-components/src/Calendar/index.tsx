import 'flatpickr/dist/flatpickr.css';

import flatpickr from 'flatpickr';
import { ComponentChild, h, VNode } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';

import { FormComponent, FormComponentProps } from '..';
import { Icon } from '../Icon';

type CalendarProps = Omit<FormComponentProps, 'children'> &
  Pick<flatpickr.Options.Options, 'enableTime' | 'mode'> & {
    /**
     * Whether or not the input should be disabled.
     */
    disabled?: boolean;

    /**
     * An error message to render.
     */
    error?: ComponentChild;

    /**
     * A help message to render.
     */
    help?: ComponentChild;

    /**
     * The name of the HTML element.
     */
    name: string;

    onChange?: (event: Event, values: Date[]) => void;

    /**
     * A placeholder to render if the input is empty,
     */
    placeholder?: string;

    /**
     * Mark the input as read only.
     */
    readOnly?: boolean;
  };

export function Calendar({
  className,
  disabled,
  enableTime,
  error,
  help,
  iconLeft,
  label,
  mode = 'single',
  name,
  onChange,
  optionalLabel,
  placeholder,
  readOnly,
  required,
  tag,
  id = name,
}: CalendarProps): VNode {
  const ref = useRef<HTMLInputElement>();
  const wrapper = useRef<HTMLDivElement>();
  const [picker, setPicker] = useState<flatpickr.Instance>(null);

  const handleChange = useCallback(
    (event: Event) => {
      if (picker) {
        onChange(event, picker.selectedDates);
      }
    },
    [onChange, picker],
  );

  useEffect(() => {
    const p = flatpickr(ref.current, {
      appendTo: wrapper.current,
      enableTime,
      mode,
      time_24hr: true,
    });

    setPicker(p);

    return p.destroy;
  }, [enableTime, mode]);

  return (
    <FormComponent
      className={className}
      iconLeft={iconLeft}
      id={id}
      label={label}
      optionalLabel={optionalLabel}
      ref={wrapper}
      required={required}
      tag={tag}
    >
      <input
        className="input"
        disabled={disabled}
        id={id}
        name={name}
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        ref={ref}
      />
      {iconLeft && <Icon className="is-left" icon={iconLeft} />}
      {help && <p className="help">{help}</p>}
      {error && <p className="help is-danger">{error}</p>}
    </FormComponent>
  );
}
