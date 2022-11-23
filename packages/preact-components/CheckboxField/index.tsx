import { ComponentChild, ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';

import { IconCheckbox } from '../IconCheckbox/index.js';
import { Checkbox, FormComponent, SharedFormComponentProps } from '../index.js';

type CheckboxFieldProps = Omit<ComponentProps<typeof Checkbox>, 'error'> &
  SharedFormComponentProps & {
    /**
     * The name HTML element.
     */
    name?: string;

    /**
     * The title to display right of the checkbox.
     */
    title?: ComponentChild;

    /**
     * The class used for the FormComponent wrapper.
     */
    wrapperClassName?: string;
  };

/**
 * A Bulma styled form select element.
 */
export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  (
    {
      wrapperClassName,
      error,
      help = null,
      label,
      name,
      id = name,
      title,
      tag,
      optionalLabel,
      icon,
      inline,
      switch: isSwitch,
      ...props
    },
    ref,
  ) => (
    <FormComponent
      className={wrapperClassName}
      help={help}
      id={id}
      inline={inline}
      label={label}
      optionalLabel={optionalLabel}
      required
      tag={tag}
    >
      {icon && !isSwitch ? (
        <IconCheckbox
          {...props}
          error={Boolean(error)}
          icon={icon}
          id={id}
          label={title}
          name={name}
          ref={ref}
        />
      ) : (
        <Checkbox
          {...props}
          error={Boolean(error)}
          id={id}
          label={title}
          name={name}
          ref={ref}
          switch={isSwitch}
        />
      )}
    </FormComponent>
  ),
);
