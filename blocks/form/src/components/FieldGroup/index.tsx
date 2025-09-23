import { useBlock } from '@appsemble/preact';
import classNames from 'classnames';
import { type ComponentChildren, type VNode } from 'preact';
import {
  type Dispatch,
  type MutableRef,
  type StateUpdater,
  useCallback,
  useMemo,
} from 'preact/hooks';

import styles from './index.module.css';
import {
  type Field,
  type FieldErrorMap,
  type FormDisplay,
  type StringField,
  type Values,
} from '../../../block.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { FormInput } from '../FormInput/index.js';

interface FieldGroupProps {
  readonly formDataLoading: boolean;

  /**
   * Whether the inputs should be disabled.
   */
  disabled?: boolean;

  display?: FormDisplay;

  /**
   * The errors that apply to the input values.
   */
  errors: FieldErrorMap;

  /**
   * The fields to render.
   */
  fields: Field[];

  /**
   * Whether fields should span to the whole width if the field group.
   */
  fieldSpan?: boolean;

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

  /**
   * Used to set the element for scrolling to the field error
   */
  readonly setFieldErrorLink?: (
    fieldName: string,
    params: { ref: MutableRef<HTMLElement>; error: string; label: string },
  ) => void;

  readonly addThumbnail: (thumbnail: File) => void;

  readonly removeThumbnail: (thumbnail: File) => void;

  readonly setFieldsReady: Dispatch<StateUpdater<Record<Field['name'], boolean>>>;
}

/**
 * A group of form fields.
 */
export function FieldGroup({
  addThumbnail,
  disabled,
  display = 'flex',
  errors,
  fieldSpan,
  fields,
  formDataLoading,
  formValues,
  name,
  onChange,
  removeThumbnail,
  setFieldErrorLink,
  setFieldsReady,
}: FieldGroupProps): VNode {
  const { utils } = useBlock();

  const handleChange = useCallback(
    (localName: string, val: unknown) => {
      // @ts-expect-error strictNullChecks undefined is not assignable
      onChange(name, { ...(getValueByNameSequence(name, formValues) as Values), [localName]: val });
    },
    [name, onChange, formValues],
  );

  const getFieldsContainerClass = (): string => {
    switch (display) {
      case 'flex':
        return classNames({
          [styles.wrapper]: fields.some((f: any) => f?.inline),
        });
      case 'grid':
        return classNames({
          [styles['wrapper-grid']]: true,
        });
      default:
        return classNames({
          [styles.wrapper]: fields.some((f: any) => f?.inline),
        });
    }
  };

  const fieldsetEntryValues = useMemo(() => {
    const newFieldsetEntryValues: Values = {};
    for (const field of fields) {
      newFieldsetEntryValues[field.name] = getValueByNameSequence(
        `${name}.${field.name}`,
        formValues,
      );
    }
    return newFieldsetEntryValues;
  }, [fields, formValues, name]);

  const show = useCallback(
    (field: Field) =>
      field.show === undefined ||
      Boolean(utils.remap(field.show, { ...formValues, fieldsetEntryValues })),
    [utils, formValues, fieldsetEntryValues],
  );

  return (
    <div className={getFieldsContainerClass()}>
      {fields
        .filter((f) => f.type === 'enum' || show(f))
        .map((f) => (
          <FormInput
            addThumbnail={addThumbnail}
            className={`mb-4 ${f.type === 'enum' && !show(f) ? 'is-hidden' : ''} ${String(
              classNames({
                [styles['column-span']]:
                  fieldSpan ||
                  ['fieldset', 'tags', 'file', 'selection', 'markdown'].includes(f.type) ||
                  (f as StringField).multiline,
              }),
            )}`}
            disabled={disabled}
            display={display}
            error={errors?.[f.name]}
            field={f}
            fieldsetEntryValues={fieldsetEntryValues}
            formDataLoading={formDataLoading}
            formValues={formValues}
            key={f.name}
            name={name ? `${name}.${f.name}` : f.name}
            onChange={handleChange}
            removeThumbnail={removeThumbnail}
            setFieldErrorLink={setFieldErrorLink}
            setFieldsReady={setFieldsReady}
          />
        ))}
    </div>
  ) as ComponentChildren as VNode;
}
