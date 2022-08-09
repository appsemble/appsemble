import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { FormComponent, Select, SharedFormComponentProps } from '../index.js';

type SelectFieldProps = Omit<
  ComponentPropsWithoutRef<typeof Select>,
  keyof SharedFormComponentProps
> &
  SharedFormComponentProps;

/**
 * A Bulma styled form select element.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    { fullWidth = true, className, help, label, name, required, icon, id = name, ...props },
    ref,
  ) => (
    <FormComponent
      className={className}
      help={help}
      icon={icon}
      id={id}
      label={label}
      required={required}
    >
      <Select fullWidth={fullWidth} id={id} name={name} ref={ref} required={required} {...props} />
    </FormComponent>
  ),
);
