import { type ChangeEvent, type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { FormComponent, ValuePickerProvider } from '../index.js';

interface RadioGroupProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'label' | 'onChange' | 'value'> {
  readonly children: ReactNode;

  /**
   * An error message to render.
   */
  readonly error?: ReactNode;

  /**
   * The label to display above the checkbox.
   */
  readonly label?: ReactNode;

  /**
   * This is fired when the input value has changed.
   */
  readonly onChange: (event: ChangeEvent<HTMLInputElement>, value: any) => void;

  /**
   * The current value.
   */
  readonly value: any;
}

export function RadioGroup({
  children,
  className,
  error,
  label,
  name,
  onChange,
  required,
  value,
}: RadioGroupProps): ReactNode {
  return (
    <FormComponent className={className} id={name} label={label} required={required}>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore 2322 null is not assignable to type (strictNullChecks) */}
      <ValuePickerProvider name={name} onChange={onChange} value={value}>
        {children}
        {error ? <p className="help is-danger">{error}</p> : null}
      </ValuePickerProvider>
    </FormComponent>
  );
}
