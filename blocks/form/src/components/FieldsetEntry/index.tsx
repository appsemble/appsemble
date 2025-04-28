import { type VNode } from 'preact';
import { type Dispatch, type MutableRef, type StateUpdater, useCallback } from 'preact/hooks';

import {
  type Field,
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

  readonly formDataLoading: boolean;

  readonly display?: FormDisplay;

  readonly fieldSpan?: boolean;

  readonly setFieldErrorLink?: (
    fieldName: string,
    params: { ref: MutableRef<any>; error: string; label: string },
  ) => void;

  readonly addThumbnail: (thumbnail: File) => void;

  readonly removeThumbnail: (thumbnail: File) => void;

  readonly setFieldsReady: Dispatch<StateUpdater<Record<Field['name'], boolean>>>;
}

/**
 * An input element for a simple fieldset entry.
 */
export function FieldsetEntry({
  addThumbnail,
  disabled,
  display,
  error,
  field,
  fieldSpan,
  formDataLoading,
  formValues,
  index,
  name,
  onChange,
  removeThumbnail,
  setFieldErrorLink,
  setFieldsReady,
}: FieldsetEntryProps): VNode {
  const onChangeIndex = useCallback(
    (localName: string, values: Values) => {
      onChange(String(index), values);
    },
    [index, onChange],
  );

  return (
    <FieldGroup
      addThumbnail={addThumbnail}
      disabled={disabled}
      display={display}
      errors={error as FieldErrorMap}
      fields={field.fields}
      fieldSpan={fieldSpan}
      formDataLoading={formDataLoading}
      formValues={formValues}
      name={name}
      onChange={index == null ? onChange : onChangeIndex}
      removeThumbnail={removeThumbnail}
      setFieldErrorLink={setFieldErrorLink}
      setFieldsReady={setFieldsReady}
    />
  );
}
