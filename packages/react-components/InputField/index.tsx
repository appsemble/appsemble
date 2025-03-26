import { type ComponentPropsWithoutRef, forwardRef } from 'react';

import { FormComponent, Input, type SharedFormComponentProps } from '../index.js';

type InputFieldProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  keyof SharedFormComponentProps
> &
  SharedFormComponentProps;

function getHelpExtra(
  maxLength: number | undefined,
  value?: number | string | readonly string[],
): string | undefined {
  if (!maxLength) {
    return;
  }
  const length = value == null ? 0 : String(value).length;
  if (length > maxLength * 0.8) {
    return `${length} / ${maxLength}`;
  }
}

/**
 * A Bulma styled form input element.
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      addonLeft,
      addonRight,
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
      addonLeft={addonLeft}
      addonRight={addonRight}
      className={className}
      control={control}
      error={error}
      help={help}
      helpExtra={getHelpExtra(maxLength, value)}
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
