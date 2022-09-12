import { ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';

import { FormComponent, Select, SharedFormComponentProps } from '../index.js';

type SelectFieldProps = Omit<ComponentProps<typeof Select>, keyof SharedFormComponentProps> &
  SharedFormComponentProps;

/**
 * A Bulma styled form select element.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    {
      fullWidth = true,
      className,
      help,
      label,
      required,
      icon,
      name,
      id = name,
      tag,
      optionalLabel,
      ...props
    },
    ref,
  ) => (
    <FormComponent
      className={className}
      help={help}
      icon={icon}
      id={id}
      label={label}
      optionalLabel={optionalLabel}
      required={required}
      tag={tag}
    >
      <Select fullWidth={fullWidth} id={id} name={name} ref={ref} required={required} {...props} />
    </FormComponent>
  ),
);
