import classNames from 'classnames';
import { ComponentChild, h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import FormComponent, { FormComponentProps } from '../FormComponent';
import Icon from '../Icon';

type InputEventHandler<T> = (event: Event, value: T) => void;

interface GenericInputProps<T, H extends string> extends Omit<FormComponentProps, 'children'> {
  /**
   * The HTML input type.
   *
   * This may be extended if necessary.
   */
  type: H;

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

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `checkbox`, the value is a boolean. If the input type is `number`, the
   * value is a number, otherwise it is a string.
   */
  onInput: InputEventHandler<T>;

  /**
   * A placeholder to render if the input is empty,
   */
  placeholder?: string;

  /**
   * The current value of the input.
   */
  value: T;

  /**
   * Mark the input as read only.
   */
  readOnly?: boolean;
}

export type BooleanInputProps = GenericInputProps<boolean, 'checkbox'>;

export interface NumberInputProps extends GenericInputProps<number, 'number'> {
  /**
   * A maximum numeric value.
   */
  max?: number;

  /**
   * A minimum numeric value.
   */
  min?: number;

  /**
   * By how much to increment or decrement a numeric input.
   */
  step?: number;
}

export interface StringInputProps
  extends GenericInputProps<
    string,
    | 'color'
    | 'email'
    | 'password'
    | 'search'
    | 'tel'
    | 'text'
    | 'textarea'
    | 'url'
    | null
    | undefined
  > {
  maxLength?: number;
  minLength?: number;
}

export type InputProps = BooleanInputProps | NumberInputProps | StringInputProps;

/**
 * A Bulma styled form input element.
 */
export default function Input({
  className,
  disabled,
  error,
  iconLeft,
  help,
  label,
  name,
  onInput,
  required,
  type,
  value,
  id = name,
  ...props
}: InputProps): VNode {
  const handleInput = useCallback(
    (event: Event): void => {
      const target = event.target as HTMLInputElement;
      if (type === 'number') {
        (onInput as InputEventHandler<number>)(event, target.valueAsNumber);
      } else if (type === 'checkbox') {
        (onInput as InputEventHandler<boolean>)(event, target.checked);
      } else {
        (onInput as InputEventHandler<string>)(event, target.value);
      }
    },
    [onInput, type],
  );

  const Comp = type === 'textarea' ? 'textarea' : 'input';

  return (
    <FormComponent
      className={className}
      iconLeft={iconLeft}
      id={id}
      label={label}
      required={required}
    >
      <Comp
        checked={type === 'checkbox' ? (value as boolean) : undefined}
        className={classNames(type === 'textarea' ? 'textarea' : 'input', { 'is-danger': error })}
        disabled={disabled}
        id={id}
        name={name}
        onInput={handleInput}
        required={required}
        type={type !== 'textarea' ? type : undefined}
        value={`${value}`}
        {...props}
      />
      {iconLeft && <Icon className="is-left" icon={iconLeft} />}
      {help && <p className="help">{help}</p>}
      {error && <p className="help is-danger">{error}</p>}
    </FormComponent>
  );
}
