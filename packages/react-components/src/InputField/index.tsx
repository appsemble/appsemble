import React, { ComponentPropsWithoutRef, forwardRef } from 'react';

import { FormComponent, Input, SharedFormComponentProps } from '..';

type InputFieldProps = SharedFormComponentProps &
  Omit<ComponentPropsWithoutRef<typeof Input>, keyof SharedFormComponentProps>;

/**
 * A Bulma styled form input element.
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      className,
      control,
      error,
      icon,
      help,
      label,
      maxLength,
      name,
      required,
      value,
      id = name,
      ...props
    },
    ref,
  ) => (
    <FormComponent
      className={className}
      control={control}
      error={error}
      help={help}
      helpExtra={maxLength ? `${value == null ? 0 : String(value).length} / ${maxLength}` : null}
      icon={icon}
      id={id}
      label={label}
      required={required}
    >
      <Input
        {...props}
        error={Boolean(error)}
        id={id}
        maxLength={maxLength}
        name={name}
        ref={ref}
        required={required}
        value={value}
      />
    </FormComponent>
  ),
);
