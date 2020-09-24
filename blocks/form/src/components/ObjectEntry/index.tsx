import { h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { FieldErrorMap, InputProps, ObjectField, Values } from '../../../block';
import { FieldGroup } from '../FieldGroup';

interface ObjectEntryProps extends InputProps<Values, ObjectField> {
  /**
   * If defined, the index is used in the change `onChange` handler instead of the field name.
   */
  index?: number;
}

/**
 * An input element for a simple object entry.
 */
export function ObjectEntry({
  disabled,
  error,
  field,
  index,
  name,
  onChange,
  value,
}: ObjectEntryProps): VNode {
  const onChangeIndex = useCallback(
    (localName: string, values: Values | Values, errors: FieldErrorMap) => {
      onChange(String(index), values, errors);
    },
    [index, onChange],
  );

  return (
    <FieldGroup
      disabled={disabled}
      errors={error as FieldErrorMap}
      fields={field.fields}
      name={name}
      onChange={index == null ? onChange : onChangeIndex}
      value={value}
    />
  );
}
