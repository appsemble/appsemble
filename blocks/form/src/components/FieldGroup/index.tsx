import { ComponentChildren, h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { Field, FieldError, FieldErrorMap, Values } from '../../../block';
import { FormInput } from '../FormInput';

interface FieldGroupProps {
  /**
   * Whether the inputs should be disabled.
   */
  disabled?: boolean;

  /**
   * The erors that apply to the input values.
   */
  errors: FieldErrorMap;

  /**
   * The fields to render.
   */
  fields: Field[];

  /**
   * The name of the input group.
   */
  name?: string;

  /**
   * This is called whenever the input changes.
   *
   * @param name - The name of the input group.
   * @param value - The updated value.
   * @param errors - The errors that apply to the field group
   */
  onChange: (name: string, value: Values, errors: FieldErrorMap) => void;

  /**
   * The current values.
   */
  value: Values;
}

/**
 * A group of form fields.
 */
export function FieldGroup({
  disabled,
  errors,
  fields,
  name,
  onChange,
  value,
}: FieldGroupProps): VNode {
  const handleChange = useCallback(
    (localName: string, val: unknown, error: FieldError) => {
      onChange(
        name,
        { ...value, [localName]: val },
        // Small optimization to prevent useless renders.
        errors[localName] === error ? errors : { ...errors, [localName]: error },
      );
    },
    [errors, name, onChange, value],
  );

  return (fields.map((f) => (
    <FormInput
      disabled={disabled}
      error={errors[f.name]}
      field={f}
      key={f.name}
      name={name ? `${name}.${f.name}` : f.name}
      onChange={handleChange}
      value={value[f.name]}
    />
  )) as ComponentChildren) as VNode;
}
