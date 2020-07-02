import BulmaCalendar, { Options } from 'bulma-calendar';
import classNames from 'classnames';
import React, {
  cloneElement,
  ComponentPropsWithoutRef,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import FormComponent from '../FormComponent';
import Icon from '../Icon';

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
    onChange: (event: { target: HTMLInputElement }, value: Date) => void;

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
export default forwardRef<HTMLInputElement, CalendarProps>(
  (
    {
      control,
      displayMode,
      error,
      iconLeft,
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
        onChange({ target: inputRef.current }, calendarRef.current.startDate);
      });

      return () => {
        calendarRef.current.removeListeners('select');
      };
    }, [onChange]);

    return (
      <FormComponent
        iconLeft={iconLeft}
        iconRight={!!control}
        id={id}
        label={label}
        required={required}
      >
        <input
          {...props}
          ref={inputRef}
          defaultValue={value}
          id={id}
          maxLength={maxLength}
          name={name}
          required={required}
        />
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
        {control && cloneElement(control, { className: 'is-right' })}
        <p className={classNames('help', { 'is-danger': error })}>
          {isValidElement(error) ? error : help}
        </p>
      </FormComponent>
    );
  },
);
