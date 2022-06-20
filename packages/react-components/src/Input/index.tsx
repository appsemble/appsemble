import classNames from 'classnames';
import { ChangeEvent, ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';

export interface InputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'label' | 'loading' | 'onChange' | 'pattern'> {
  /**
   * If specified, a datalist element will be rendered to provided autocomplete options.
   */
  datalist?: string[];

  /**
   * Whether to render the input in an error state.
   */
  error?: boolean;

  /**
   * Indicate the select box is in a loading state.
   */
  loading?: boolean;

  /**
   * This is fired when the input value has changed.
   *
   * If the input type is `number`, the value is a number, otherwise it is a string.
   */
  onChange?: (event: ChangeEvent<HTMLInputElement>, value: number | string) => void;

  /**
   * A regular expression the input must match.
   */
  pattern?: RegExp | string;

  /**
   * The HTML input type.
   *
   * This may be extended if necessary.
   */
  type?:
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'number'
    | 'password'
    | 'search'
    | 'tel'
    | 'text'
    | 'url';
}

/**
 * A Bulma styled form input element.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      datalist,
      error,
      loading,
      name,
      onChange,
      pattern,
      readOnly,
      type,
      id = name,
      ...props
    },
    ref,
  ) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const { currentTarget } = event;
        onChange(event, type === 'number' ? currentTarget.valueAsNumber : currentTarget.value);
      },
      [onChange, type],
    );

    return (
      <>
        <input
          {...props}
          className={classNames('input', className, {
            'has-background-white-bis': readOnly,
            'is-danger': error,
            'is-loading': loading,
          })}
          id={id}
          list={datalist ? `${id}-dataset` : null}
          name={name}
          onChange={handleChange}
          pattern={pattern instanceof RegExp ? pattern.source : pattern}
          readOnly={readOnly}
          ref={ref}
          type={type}
        />
        {datalist ? (
          <datalist id={datalist ? `${id}-dataset` : null}>
            {datalist.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        ) : null}
      </>
    );
  },
);
