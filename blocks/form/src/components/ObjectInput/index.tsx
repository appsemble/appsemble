import { useBlock } from '@appsemble/preact';
import { h, VNode } from 'preact';

import type { FieldErrorMap, InputProps, ObjectField } from '../../../block';
import { FieldGroup } from '../FieldGroup';

type ObjectInputProps = InputProps<{ [key: string]: unknown }, ObjectField>;

/**
 * An input element for a text type schema.
 */
export function ObjectInput({
  disabled,
  error,
  field,
  name,
  onChange,
  value,
}: ObjectInputProps): VNode {
  const { utils } = useBlock();

  return (
    <fieldset className="appsemble-object">
      <legend className="title is-5">{utils.remap(field.label, value)}</legend>
      <FieldGroup
        disabled={disabled}
        errors={error as FieldErrorMap}
        fields={field.fields}
        name={name}
        onChange={onChange}
        value={value}
      />
    </fieldset>
  );
}
