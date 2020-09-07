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
  disabled,
  error,
  label,
  name,
  onChange,
  optionalLabel,
  readOnly,
  required,
  tag,
  value,
}: RadioGroupProps): VNode {
  const handleChange = useCallback(
    (event: h.JSX.TargetedEvent<HTMLInputElement>) => {
      onChange(event, event.currentTarget.value);
    },
    [onChange],
  );

  return (
    <FormComponent
      className={className}
      id={name}
      label={label}
      optionalLabel={optionalLabel}
      required={required}
      tag={tag}
    >
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
