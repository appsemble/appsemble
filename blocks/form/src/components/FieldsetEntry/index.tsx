import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import {
  type FieldErrorMap,
  type Fieldset,
  type FormDisplay,
  type InputProps,
  type Values,
} from '../../../block.js';
import { FieldGroup } from '../FieldGroup/index.js';

interface FieldsetEntryProps extends InputProps<Values, Fieldset> {
  /**
   * If defined, the index is used in the change `onChange` handler instead of the field name.
   */
  readonly index?: number;

  readonly display?: FormDisplay;

  readonly fieldSpan?: boolean;
}

/**
 * An input element for a simple fieldset entry.
 */
export function FieldsetEntry({
  disabled,
  display,
  error,
  field,
  fieldSpan,
  formValues,
  index,
  name,
  onChange,
}: FieldsetEntryProps): VNode {
  const onChangeIndex = useCallback(
    (localName: string, values: Values) => {
      onChange(String(index), values);
    },
    [index, onChange],
  );

  return (
    <FieldGroup
      disabled={disabled}
      display={display}
      errors={error as FieldErrorMap}
      fields={field.fields}
      fieldSpan={fieldSpan}
      formValues={formValues}
      name={name}
      onChange={index == null ? onChange : onChangeIndex}
    />
  );
}
