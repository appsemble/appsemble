import 'flatpickr/dist/flatpickr.css';

import classNames from 'classnames';
import flatpickr from 'flatpickr';
import { ComponentPropsWithoutRef, forwardRef, useEffect, useRef, useState } from 'react';

import { FormComponent, Input, SharedFormComponentProps } from '..';
import { useCombinedRefs } from '../useCombinedRefs';
import styles from './index.css';

type DateTimeFieldProps = Omit<ComponentPropsWithoutRef<typeof Input>, 'error'> &
  Pick<flatpickr.Options.Options, 'enableTime' | 'mode'> &
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
    onChange?: (
      event: { target: HTMLInputElement; currentTarget: HTMLInputElement },
      value: Date | string,
    ) => void;

    /**
     * The current value as a Date object or an ISO8601 formatted string.
     */
    value: Date | string;
  };

export const DateTimeField = forwardRef<HTMLInputElement, DateTimeFieldProps>(
  (
    {
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
      required,
      value,
      id = name,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>();
    const combinedRef = useCombinedRefs(ref, inputRef);
    const [picker, setPicker] = useState<flatpickr.Instance>(null);

    useEffect(() => {
      const p = flatpickr(inputRef.current, {
        static: true,
        enableTime,
        mode,
        time_24hr: true,
      });

      setPicker(p);

      return p.destroy;
    }, [enableTime, mode]);

    useEffect(() => {
      if (!picker) {
        return;
      }
      const { current } = inputRef;
      const handlers = picker.config.onChange;

      const handleChange = ([val]: Date[]): void => {
        onChange({ target: current, currentTarget: current }, iso ? val.toISOString() : val);
      };

      handlers.push(handleChange);

      return () => {
        const index = handlers.indexOf(handleChange);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      };
    }, [iso, onChange, picker]);

    useEffect(() => {
      if (!picker) {
        return;
      }
      picker.setDate(value);
    }, [picker, value]);

    return (
      <FormComponent
        className={classNames(className, styles.wrapper)}
        error={error}
        help={help}
        icon={icon}
        id={id}
        label={label}
        required={required}
      >
        <Input {...props} className="is-fullwidth" id={id} name={name} ref={combinedRef} />
      </FormComponent>
    );
  },
);
