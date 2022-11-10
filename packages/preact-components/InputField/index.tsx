import { ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';

import { FormComponent, Input, SharedFormComponentProps } from '../index.js';

type InputFieldProps = Omit<ComponentProps<typeof Input>, keyof SharedFormComponentProps> &
  SharedFormComponentProps;

/**
 * A Bulma styled form input element.
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      addon,
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
      tag,
      optionalLabel,
      small,
      ...props
    },
    ref,
  ) => (
    <FormComponent
      addon={addon}
      className={className}
      control={control}
      error={error}
      help={help}
      helpExtra={maxLength ? `${value == null ? 0 : String(value).length} / ${maxLength}` : null}
      icon={icon}
      id={id}
      label={label}
      optionalLabel={optionalLabel}
      required={required}
      small={small}
      tag={tag}
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
