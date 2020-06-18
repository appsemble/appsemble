import { cloneElement, ComponentChild, h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { FormComponent } from '..';

interface RadioGroupProps
  extends Omit<h.JSX.HTMLAttributes<HTMLInputElement>, 'value' | 'label' | 'onChange'> {
  children: VNode<h.JSX.HTMLAttributes<HTMLInputElement>>[];

  /**
   * An error message to render.
   */
  error?: VNode;

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
}

export default function RadioGroup({
  children,
  disabled,
  error,
  label,
  name,
  onChange,
  readOnly,
  required,
  value,
}: RadioGroupProps): VNode {
  const handleChange = useCallback(
    (event: Event) => {
      onChange(event, (event.target as HTMLInputElement).value);
    },
    [onChange],
  );

  return (
    <FormComponent id={name} label={label} required={required}>
      {children.map((child, index) =>
        cloneElement(child, {
          checked: child.props.value === value,
          disabled: child.props.disabled || disabled,
          id: `${name}${index}`,
          name,
          onChange: handleChange,
          readOnly: child.props.readOnly || readOnly,
          value: child.props.value,
        }),
      )}
      {error && <p className="help is-danger">{error}</p>}
    </FormComponent>
  );
}
