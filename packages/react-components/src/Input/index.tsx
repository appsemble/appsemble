import classNames from 'classnames';
import { format } from 'date-fns';
import React, {
  ChangeEvent,
  cloneElement,
  ComponentPropsWithoutRef,
  forwardRef,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
} from 'react';

import FormComponent from '../FormComponent';
import Icon from '../Icon';
import styles from './index.css';

type InputProps = Omit<ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  Omit<ComponentPropsWithoutRef<'input'>, 'label' | 'onChange'> & {
    control?: ReactElement;

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
    onChange: (event: ChangeEvent<HTMLInputElement>, value: number | string) => void;

    /**
     * The HTML input type.
     *
     * This may be extended if necessary.
     */
    type?:
      | 'color'
      | 'email'
      | 'number'
      | 'password'
      | 'search'
      | 'tel'
      | 'text'
      | 'url'
      | 'date'
      | 'datetime-local';
  };

/**
 * A Bulma styled form input element.
 */
export default forwardRef<HTMLInputElement, InputProps>(
  (
    {
      control,
      error,
      iconLeft,
      help,
      label,
      maxLength,
      name,
      onChange,
      required,
      type,
      value,
      id = name,
      ...props
    },
    ref,
  ) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const { target } = event;
        let newValue: number | string = target.value;
        if (type === 'number') {
          newValue = target.valueAsNumber;
        } else if (type === 'date' || type === 'datetime-local') {
          newValue = new Date(
            target.valueAsNumber + new Date().getTimezoneOffset() * 60000,
          ).toISOString();
        }
        onChange(event, newValue);
      },
      [onChange, type],
    );

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
          ref={ref}
          className={classNames('input', { 'is-danger': error })}
          id={id}
          maxLength={maxLength}
          name={name}
          onChange={handleChange}
          required={required}
          type={type}
          value={
            type === 'datetime-local'
              ? format(new Date((value as number) || Date.now()), "yyyy-MM-dd'T'HH:mm:ss.SSS")
              : value
          }
        />
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
        {control && cloneElement(control, { className: 'is-right' })}
        <div className={`${styles.help} is-flex`}>
          <span className={classNames('help', { 'is-danger': error })}>
            {isValidElement(error) ? error : help}
          </span>
          {maxLength ? (
            <span className={`help ml-1 ${styles.counter}`}>
              {value == null ? 0 : `${value}`.length} / {maxLength}
            </span>
          ) : null}
        </div>
      </FormComponent>
    );
  },
);
