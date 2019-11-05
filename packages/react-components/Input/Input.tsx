import classNames from 'classnames';
import * as React from 'react';

import FormComponent from '../FormComponent';
import Icon from '../Icon';
import styles from './Input.css';

type InputProps = Omit<React.ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  Omit<React.ComponentPropsWithoutRef<'input'>, 'label' | 'onChange'> & {
    control?: React.ReactElement;

    /**
     * An error message to render.
     */
    error?: React.ReactNode;

    /**
     * A help message to render.
     */
    help?: React.ReactNode;

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
    onChange: (event: React.ChangeEvent<HTMLInputElement>, value: number | string) => void;

    /**
     * The HTML input type.
     *
     * This may be extended if necessary.
     */
    type?: 'color' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
  };

/**
 * A Bulma styled form input element.
 */
export default React.forwardRef<HTMLInputElement, InputProps>(
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
    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const { target } = event;
        onChange(event, type === 'number' ? target.valueAsNumber : target.value);
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
          value={value}
        />
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
        {control && React.cloneElement(control, { className: 'is-right' })}
        <div className={styles.help}>
          <p className={classNames('help', { 'is-danger': error })}>
            {React.isValidElement(error) ? error : help}
          </p>
          {maxLength ? (
            <span className={`help ${styles.counter}`}>{`${
              `${value}`.length
            } / ${maxLength}`}</span>
          ) : null}
        </div>
      </FormComponent>
    );
  },
);
