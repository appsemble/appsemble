import classNames from 'classnames';
import { type ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';

import { FormComponent, type SharedFormComponentProps, TextArea } from '../index.js';

type TextAreaFieldProps = Omit<ComponentProps<typeof TextArea>, keyof SharedFormComponentProps> &
  SharedFormComponentProps;

/**
 * A Bulma styled textarea element.
 */
export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (
    {
      addon,
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
      tag,
      optionalLabel,
      inline,
      errorLinkRef,
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
      inline={inline}
      label={label}
      optionalLabel={optionalLabel}
      required={required}
      tag={tag}
    >
      <TextArea
        {...props}
        className={classNames('textarea', { 'is-danger': error })}
        errorLinkRef={errorLinkRef}
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
