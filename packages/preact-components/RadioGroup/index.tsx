import { ComponentChild, JSX, VNode } from 'preact';

import { FormComponent, ValuePickerProvider } from '../index.js';

interface RadioGroupProps
  extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'label' | 'onChange' | 'value'> {
  children: VNode<JSX.HTMLAttributes<HTMLInputElement>>[];

  /**
   * An error message to render.
   */
  error?: ComponentChild;

  /**
   * The label to display above the checkbox.
   */
  label?: ComponentChild;

  /**
   * This is fired when the input value has changed.
   */
  onChange: (event: Event, value: any) => void;

  /**
   * The current value.
   */
  value: any;

  /**
   * The label to display if the input group is optional.
   */
  optionalLabel?: ComponentChild;

  /**
   * The tag to display to the right of the label.
   */
  tag?: ComponentChild;
}

export function RadioGroup({
  children,
  className,
  error,
  label,
  name,
  onChange,
  optionalLabel,
  required,
  tag,
  value,
}: RadioGroupProps): VNode {
  return (
    <FormComponent
      className={className}
      id={name}
      label={label}
      optionalLabel={optionalLabel}
      required={required}
      tag={tag}
    >
      <ValuePickerProvider name={name} onChange={onChange} value={value}>
        {children}
        {error ? <p className="help is-danger">{error}</p> : null}
      </ValuePickerProvider>
    </FormComponent>
  );
}
