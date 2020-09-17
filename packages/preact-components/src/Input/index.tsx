import classNames from 'classnames';
import { ComponentProps, h } from 'preact';
import { forwardRef } from 'preact/compat';
import { useCallback } from 'preact/hooks';

export interface InputProps
  extends Omit<ComponentProps<'input'>, 'label' | 'loading' | 'onChange' | 'onInput' | 'pattern'> {
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
  onChange?: (event: h.JSX.TargetedEvent<HTMLInputElement>, value: number | string) => void;

  /**
   * A regular expression the input must match.
   */
  pattern?: string | RegExp;

  /**
   * The HTML input type.
   *
   * This may be extended if necessary.
   *
   */
  // XXX 'date' should be removed.
  type?: 'color' | 'date' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
}

/**
 * A Bulma styled form input element.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, loading, name, onChange, pattern, type, id = name, ...props }, ref) => {
    const handleChange = useCallback(
      (event: h.JSX.TargetedEvent<HTMLInputElement>) => {
        const { currentTarget } = event;
        onChange(event, type === 'number' ? currentTarget.valueAsNumber : currentTarget.value);
      },
      [onChange, type],
    );

    return (
      <input
        {...props}
        className={classNames('input', { 'is-danger': error, 'is-loading': loading })}
        id={id}
        name={name}
        onInput={handleChange}
        pattern={pattern instanceof RegExp ? pattern.source : pattern}
        ref={ref}
        type={type}
      />
    );
  },
);
