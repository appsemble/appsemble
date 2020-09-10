import React, { ChangeEvent, ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';

import { FormComponent, Select, SharedFormComponentProps } from '..';

type SelectFieldProps = SharedFormComponentProps &
  Omit<ComponentPropsWithoutRef<typeof Select>, keyof SharedFormComponentProps>;

/**
 * A Bulma styled form select element.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  (
    { fullWidth = true, className, help, label, onChange, required, icon, id = name, ...props },
    ref,
  ) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLSelectElement>) => {
        onChange(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
      <FormComponent
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
          name={name}
          onChange={handleChange}
          ref={ref}
          required={required}
          {...props}
        />
      </FormComponent>
    );
  },
);
