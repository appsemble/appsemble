import { type ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';

import { FormComponent, Input, type SharedFormComponentProps } from '../index.js';

type InputFieldProps = Omit<ComponentProps<typeof Input>, keyof SharedFormComponentProps> &
  SharedFormComponentProps & {
    /**
     * The fraction of `maxLength` the length of the value must exceed before the character counter
     * shows. By default, the counter always shows when `maxLength` is set.
     */
    readonly counterThreshold?: number;
  };

/**
 * A Bulma styled form input element.
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      addon,
      className,
      control,
      counterThreshold,
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
      inline,
      errorLinkRef,
      ...props
    },
    ref,
  ) => {
    const length = value == null ? 0 : String(value).length;
    return (
      <FormComponent
        addon={addon}
        className={className}
        control={control}
        error={error}
        help={help}
        helpExtra={
          maxLength && (counterThreshold == null || length > Number(maxLength) * counterThreshold)
            ? `${length} / ${maxLength}`
            : null
        }
        icon={icon}
        id={id}
        inline={inline}
        label={label}
        optionalLabel={optionalLabel}
        required={required}
        tag={tag}
      >
        <Input
          {...props}
          error={Boolean(error)}
          errorLinkRef={errorLinkRef}
          id={id}
          maxLength={maxLength}
          name={name}
          ref={ref}
          required={required}
          value={value}
        />
      </FormComponent>
    );
  },
);
