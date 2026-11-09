import { InputField } from '@appsemble/preact-components';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { type ComponentProps, type VNode } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

import styles from './index.module.css';

interface TimeInputProps extends Omit<ComponentProps<typeof InputField>, 'onChange' | 'value'> {
  readonly hourCycle: 'h12' | 'h23';
  readonly name: string;
  readonly onChange: (name: string, value: string) => void;
  readonly value: string;
}

export function TimeInput({
  disabled,
  hourCycle,
  name,
  onChange,
  readOnly,
  value,
  ...props
}: TimeInputProps): VNode {
  const wrapper = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const picker = useRef<flatpickr.Instance>();
  const change = useRef(onChange);
  change.current = onChange;
  const displayFormat = hourCycle === 'h23' ? 'H:i' : 'h:i K';

  useEffect(() => {
    if (disabled || readOnly) {
      return;
    }
    const instance = flatpickr(input.current!, {
      allowInput: true,
      appendTo: wrapper.current!,
      dateFormat: displayFormat,
      disableMobile: true,
      enableTime: true,
      minuteIncrement: 1,
      noCalendar: true,
      parseDate: flatpickr.parseDate as (date: string, format: string) => Date,
      static: true,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      time_24hr: hourCycle === 'h23',
      onValueUpdate(dates) {
        change.current(name, dates[0] ? flatpickr.formatDate(dates[0], 'H:i') : '');
      },
      onChange(dates) {
        if (!dates.length) {
          change.current(name, '');
        }
      },
    });
    picker.current = instance;
    return () => {
      instance.destroy();
      picker.current = undefined;
    };
  }, [disabled, displayFormat, hourCycle, name, readOnly]);

  useEffect(() => {
    if (picker.current) {
      picker.current.setDate(value ?? '', false, 'H:i');
    } else if (input.current) {
      const date = value ? flatpickr.parseDate(value, 'H:i') : undefined;
      input.current.value = date ? flatpickr.formatDate(date, displayFormat) : '';
    }
  }, [disabled, displayFormat, readOnly, value]);

  return (
    <div className={styles.time} ref={wrapper}>
      <InputField
        {...props}
        disabled={disabled}
        maxLength={undefined}
        minLength={undefined}
        name={name}
        readOnly={readOnly}
        ref={input}
        type="text"
      />
    </div>
  );
}
