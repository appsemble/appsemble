import { type ComponentChildren, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { type Field, type FieldErrorMap, type Values } from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { FormInput } from '../FormInput/index.js';

interface FieldGroupProps {
  /**
   * Whether the inputs should be disabled.
   */
  disabled?: boolean;

  /**
   * The errors that apply to the input values.
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
   * @param name The name of the input group.
   * @param value The updated value.
   * @param errors The errors that apply to the field group
   */
  onChange: (name: string, value: Values) => void;

  /**
   * The current form values.
   */
  formValues: Values;
}

/**
 * A group of form fields.
 */
export function FieldGroup({
  disabled,
  errors,
  fields,
  formValues,
  name,
  onChange,
}: FieldGroupProps): VNode {
  const handleChange = useCallback(
    (localName: string, val: unknown) => {
      onChange(name, { ...(getValueByNameSequence(name, formValues) as Values), [localName]: val });
    },
    [name, onChange, formValues],
  );

  return fields.map((f) => (
    <FormInput
      disabled={disabled}
      error={errors?.[f.name]}
      field={f}
      formValues={formValues}
      key={f.name}
      name={name ? `${name}.${f.name}` : f.name}
      onChange={handleChange}
    />
  )) as ComponentChildren as VNode;
}
