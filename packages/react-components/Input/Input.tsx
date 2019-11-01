import classNames from 'classnames';
import * as React from 'react';

import FormComponent, { FormComponentProps } from '../FormComponent';
import Icon from '../Icon';
import styles from './Input.css';

type InteractiveElement = HTMLInputElement | HTMLTextAreaElement;

type InputProps = FormComponentProps &
  Omit<React.ComponentPropsWithoutRef<'input' | 'textarea'>, 'label' | 'onChange'> & {
    /**
     * An error message to render.
     */
    error?: React.ReactNode;

    /**
     * A help message to render.
     */
    help?: React.ReactNode;

    inputRef?: React.Ref<InteractiveElement>;

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
    onChange: (event: React.ChangeEvent<InteractiveElement>, value: number | string) => void;

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
      | 'textarea'
      | 'url';
  };

/**
 * A Bulma styled form input element.
 */
export default function Input({
  error,
  iconLeft,
  help,
  inputRef,
  label,
  maxLength,
  name,
  onChange,
  required,
  type,
  value,
  id = name,
  ...props
}: InputProps): React.ReactElement {
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<InteractiveElement>) => {
      const target = event.target as HTMLInputElement;
      onChange(event, type === 'number' ? target.valueAsNumber : target.value);
    },
    [onChange, type],
  );

  const Component = type === 'textarea' ? 'textarea' : 'input';

  return (
    <FormComponent iconLeft={iconLeft} id={id} label={label} required={required}>
      <Component
        {...(props as (React.HTMLProps<HTMLInputElement & HTMLTextAreaElement>))}
        ref={inputRef as React.Ref<any>}
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
      <div className={styles.help}>
        <p className={classNames('help', { 'is-danger': error })}>
          {React.isValidElement(error) ? error : help}
        </p>
        {maxLength ? (
          <span className={`help ${styles.counter}`}>{`${`${value}`.length} / ${maxLength}`}</span>
        ) : null}
      </div>
    </FormComponent>
  );
}
