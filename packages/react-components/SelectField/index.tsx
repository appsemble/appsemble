import { type ComponentPropsWithoutRef, forwardRef } from 'react';

import { FormComponent, Select, type SharedFormComponentProps } from '../index.js';

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
    {
      addonLeft,
      addonRight,
      fullWidth = true,
      className,
      help,
      label,
      multiple,
      name,
      required,
      icon,
      id = name,
      ...props
    },
    ref,
  ) => (
    <FormComponent
      addonLeft={addonLeft}
      addonRight={addonRight}
      className={className}
      help={help}
      icon={icon}
      id={id}
      label={label}
      required={required}
    >
      <Select
        fullWidth={fullWidth}
        id={id}
        multiple={multiple}
        name={name}
        ref={ref}
        required={required}
        size={multiple ? 5 : 1}
        {...props}
      />
    </FormComponent>
  ),
);
