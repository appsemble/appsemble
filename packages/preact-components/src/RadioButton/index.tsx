import classNames from 'classnames';
import { ComponentChild, h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

type RadioButtonProps = Omit<h.JSX.HTMLAttributes<HTMLInputElement>, 'label' | 'onChange'> & {
  error?: any;

  /**
   * The name of the HTML element.
   */
  name: string;

  /**
   * A help message to render next to the radio button.
   */
  help?: ComponentChild;

  /**
   * This is fired when the input value has changed.
   */
  onChange: (event: Event, value: any) => void;

  /**
   * Whether the label should be displayed to the right of the radio button or to the left.
   *
   * By default (false), the label will be rendered after the radio button.
   */
  rtl?: boolean;

  /**
   * The class used for the wrapper div.
   */
  wrapperClassName?: string;
};

/**
 * A Bulma styled form select element.
 */
export default function RadioButton({
  className,
  wrapperClassName,
  error,
  help = null,
  name,
  onChange,
  value,
  id = name,
  required,
  rtl,
  ...props
}: RadioButtonProps): VNode {
  const handleChange = useCallback(
    (event: Event) => {
      onChange(event, (event.target as HTMLInputElement).value);
    },
    [onChange],
  );

  return (
    <div className={wrapperClassName} required>
      <input
        {...props}
        className={classNames('is-checkradio', { 'is-rtl': rtl }, className)}
        id={id}
        name={name}
        onChange={handleChange}
        required={required}
        type="radio"
        value={value}
      />
      <label className={classNames({ 'is-danger': error })} htmlFor={id}>
        {help}
      </label>
      {error && <p className={classNames('help', { 'is-danger': error })}>{error}</p>}
    </div>
  );
}
