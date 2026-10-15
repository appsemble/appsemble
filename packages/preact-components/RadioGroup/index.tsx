import { type ComponentChild, type JSX, type VNode } from 'preact';
import { type MutableRef, useId } from 'preact/hooks';

import {
  FormComponent,
  FormComponentError,
  type SharedFormComponentProps,
  ValuePickerProvider,
} from '../index.js';

type RadioGroupProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, 'label' | 'onChange' | 'value'> &
  SharedFormComponentProps & {
    readonly children: VNode<JSX.HTMLAttributes<HTMLInputElement>>[];

    /**
     * An error message to render.
     */
    readonly error?: ComponentChild;

    /**
     * The label to display above the checkbox.
     */
    readonly label?: ComponentChild;

    /**
     * This is fired when the input value has changed.
     */
    readonly onChange: (event: Event, value: any) => void;

    /**
     * The current value.
     */
    readonly value: any;

    /**
     * The tag to display to the right of the label.
     */
    readonly tag?: ComponentChild;

    /**
     * The ref to the element used for scrolling to the field error
     */
    readonly errorLinkRef?: MutableRef<HTMLElement>;
  };

export function RadioGroup({
  children,
  className,
  error,
  errorLinkRef,
  label,
  name,
  onChange,
  optionalLabel,
  required,
  tag,
  value,
}: RadioGroupProps): VNode {
  const labelId = useId();

  return (
    <FormComponent
      className={className}
      label={label}
      labelId={labelId}
      optionalLabel={optionalLabel}
      required={required}
      tag={tag}
    >
      <ValuePickerProvider
        errorLinkRef={errorLinkRef}
        name={name}
        onChange={onChange}
        value={value}
      >
        <div aria-labelledby={label ? labelId : undefined} role="radiogroup">
          <FormComponentError error={error}>{children}</FormComponentError>
        </div>
      </ValuePickerProvider>
    </FormComponent>
  );
}
