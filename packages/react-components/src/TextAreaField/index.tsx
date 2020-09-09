import classNames from 'classnames';
import React, { ChangeEvent, ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';

import { FormComponent, SharedFormComponentProps, TextArea } from '..';

type TextAreaFieldProps = SharedFormComponentProps &
  Omit<ComponentPropsWithoutRef<typeof TextArea>, keyof SharedFormComponentProps>;

/**
 * A Bulma styled textarea element.
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      className,
      control,
      error,
      help,
      icon,
      label,
      maxLength,
      name,
      onChange,
      required,
      value,
      id = name,
      ...props
    },
    ref,
  ) => {
    const handleChange = useCallback(
      (event: ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event, event.currentTarget.value);
      },
      [onChange],
    );

    return (
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
        <TextArea
          {...props}
          className={classNames('textarea', { 'is-danger': error })}
          id={id}
          maxLength={maxLength}
          name={name}
          onChange={handleChange}
          ref={ref}
          required={required}
          value={value}
        />
      </FormComponent>
    );
  },
);
