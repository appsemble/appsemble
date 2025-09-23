import { type ComponentChild, type ComponentProps } from 'preact';
import { forwardRef } from 'preact/compat';
import { type MutableRef } from 'preact/hooks';

import { IconCheckbox } from '../IconCheckbox/index.js';
import {
  Checkbox,
  FormComponent,
  type SharedFormComponentProps,
  useCombinedRefs,
} from '../index.js';

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

    /**
     * The ref to use for the error link
     */
    readonly errorLinkRef?: MutableRef<HTMLElement>;
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
      errorLinkRef,
      switch: isSwitch,
      ...props
    },
    ref,
  ) => {
    const combinedRef = useCombinedRefs(
      ref as MutableRef<HTMLElement>,
      errorLinkRef as MutableRef<HTMLElement>,
    );
    return (
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
            ref={combinedRef}
          />
        ) : (
          <Checkbox
            {...props}
            error={Boolean(error)}
            id={id}
            label={title}
            name={name}
            ref={combinedRef}
            switch={isSwitch}
          />
        )}
      </FormComponent>
    );
  },
);
