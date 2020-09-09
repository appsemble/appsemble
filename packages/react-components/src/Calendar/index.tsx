import BulmaCalendar, { Options } from 'bulma-calendar';
import React, {
  ComponentPropsWithoutRef,
  forwardRef,
  ReactElement,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import { FormComponent } from '..';

type CalendarProps = Omit<ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  Omit<ComponentPropsWithoutRef<'input'>, 'label' | 'onChange'> & {
    control?: ReactElement;

    displayMode?: Options['displayMode'];

    /**
     * An error message to render.
     */
    error?: ReactNode;

    /**
     * A help message to render.
     */
    help?: ReactNode;

    /**
     * The name of the HTML element.
     */
    name: string;

    /**
     * This is fired when the input value has changed.
     *
     * If the input type is `checkbox`, the value is a boolean. If the input type is `number`, the
     * value is a number, otherwise it is a string.
     */
    onChange: (event: { currentTarget: HTMLInputElement }, value: Date) => void;

    showHeader?: boolean;

    /**
     * The HTML input type.
     *
     * This may be extended if necessary.
     */
    type?: 'date' | 'time' | 'datetime';
  };

/**
 * A Bulma styled form input element.
 */
export const Calendar = forwardRef<HTMLInputElement, CalendarProps>(
  (
    {
      control,
      displayMode,
      error,
      icon,
      help,
      label,
      maxLength,
      name,
      onChange,
      required,
      showHeader = false,
      type = 'datetime',
      value,
      id = name,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>();
    const calendarRef = useRef<BulmaCalendar>();

    useImperativeHandle(ref, () => inputRef.current);
    useEffect(() => {
      calendarRef.current = new BulmaCalendar(inputRef.current, {
        showHeader,
        type,
        displayMode,
      });
    }, [displayMode, showHeader, type]);

    useEffect(() => {
      calendarRef.current.on('select', () => {
        onChange({ currentTarget: inputRef.current }, calendarRef.current.startDate);
      });

      return () => {
        calendarRef.current.removeListeners('select');
      };
    }, [onChange]);

    return (
      <FormComponent
        control={control}
        error={error}
        help={help}
        icon={icon}
        id={id}
        label={label}
        required={required}
      >
        <input
          {...props}
          defaultValue={value}
          id={id}
          maxLength={maxLength}
          name={name}
          ref={inputRef}
          required={required}
        />
      </FormComponent>
    );
  },
);
