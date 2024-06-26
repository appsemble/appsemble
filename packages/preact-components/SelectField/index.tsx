import { type ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';

import { FormComponent, Select, type SharedFormComponentProps } from '../index.js';

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
      inline,
      error,
      errorLinkRef,
      ...props
    },
    ref,
  ) => (
    <FormComponent
      className={className}
      help={help}
      icon={icon}
      id={id}
      inline={inline}
      label={label}
      optionalLabel={optionalLabel}
      required={required}
      tag={tag}
    >
      <Select
        errorLinkRef={errorLinkRef}
        fullWidth={fullWidth}
        id={id}
        name={name}
        ref={ref}
        required={required}
        {...props}
      />
    </FormComponent>
  ),
);
