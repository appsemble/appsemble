import { type ComponentPropsWithoutRef, forwardRef, type ReactNode } from 'react';

import { Checkbox, FormComponent, type SharedFormComponentProps } from '../index.js';

type CheckboxFieldProps = Omit<ComponentPropsWithoutRef<typeof Checkbox>, 'error'> &
  SharedFormComponentProps & {
    /**
     * The title to display right of the checkbox.
     */
    title?: ReactNode;

    /**
     * The class used for the FormComponent wrapper.
     */
    wrapperClassName?: string;
  };

/**
 * A Bulma styled form select element.
 */
export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ wrapperClassName, error, help = null, label, name, id = name, title, ...props }, ref) => (
    <FormComponent className={wrapperClassName} help={help} id={id} label={label} required>
      <Checkbox {...props} error={Boolean(error)} id={id} label={title} name={name} ref={ref} />
    </FormComponent>
  ),
);
