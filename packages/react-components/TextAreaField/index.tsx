import classNames from 'classnames';
import { ComponentPropsWithoutRef, forwardRef } from 'react';

import { FormComponent, SharedFormComponentProps, TextArea } from '../index.js';

type TextAreaFieldProps = Omit<
  ComponentPropsWithoutRef<typeof TextArea>,
  keyof SharedFormComponentProps
> &
  SharedFormComponentProps;

/**
 * A Bulma styled textarea element.
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      addonLeft,
      addonRight,
      className,
      control,
      error,
      help,
      icon,
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
      helpExtra={maxLength ? `${value == null ? 0 : String(value).length} / ${maxLength}` : null}
      icon={icon}
      id={id}
      label={label}
      required={required}
    >
      <TextArea
        {...props}
        className={classNames('textarea', { 'is-danger': error })}
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
