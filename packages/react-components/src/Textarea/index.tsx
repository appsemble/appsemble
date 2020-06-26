import classNames from 'classnames';
import * as React from 'react';

import FormComponent from '../FormComponent';
import Icon from '../Icon';
import styles from './index.css';

type TextAreaProps = Omit<React.ComponentPropsWithoutRef<typeof FormComponent>, 'children'> &
  Omit<React.ComponentPropsWithoutRef<'textarea'>, 'label' | 'onChange'> & {
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
     */
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>, value: string) => void;
  };

/**
 * A Bulma styled textarea element.
 */
export default React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
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
      value,
      id = name,
      ...props
    },
    ref,
  ) => {
    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event, event.target.value);
      },
      [onChange],
    );

    return (
      <FormComponent
        iconLeft={iconLeft}
        iconRight={!!control}
        id={id}
        label={label}
        required={required}
      >
        <textarea
          {...props}
          ref={ref}
          className={classNames('textarea', { 'is-danger': error })}
          id={id}
          maxLength={maxLength}
          name={name}
          onChange={handleChange}
          required={required}
          value={value}
        />
        {iconLeft && <Icon className="is-left" icon={iconLeft} />}
        {control && React.cloneElement(control, { className: 'is-right' })}
        <div className={`${styles.help} is-flex`}>
          <p className={classNames('help', { 'is-danger': error })}>
            {React.isValidElement(error) ? error : help}
          </p>
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
