import { type ComponentChild, type JSX, type VNode } from 'preact';

import { FormComponent, type SharedFormComponentProps, ValuePickerProvider } from '../index.js';

type RadioGroupProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, 'label' | 'onChange' | 'value'> &
  SharedFormComponentProps & {
    readonly children: VNode<JSX.HTMLAttributes<HTMLInputElement>>[];

    /**
     * An error message to render.
     */
    readonly error?: ComponentChild;

    /**
     * The label to display above the checkbox.
     */
    readonly label?: ComponentChild;

    /**
     * This is fired when the input value has changed.
     */
    readonly onChange: (event: Event, value: any) => void;

    /**
     * The current value.
     */
    readonly value: any;

    /**
     * The label to display if the input group is optional.
     */
    readonly optionalLabel?: ComponentChild;

    /**
     * The tag to display to the right of the label.
     */
    readonly tag?: ComponentChild;
  };

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
