import classNames from 'classnames';
import { type ComponentChildren, type VNode } from 'preact';
import { useCallback } from 'preact/hooks';

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
}

/**
 * A group of form fields.
 */
export function FieldGroup({
  disabled,
  display = 'flex',
  errors,
  fieldSpan,
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

  return (
    <div className={getFieldsContainerClass()}>
      {fields.map((f) => (
        <FormInput
          className={String(
            classNames({
              [styles['column-span']]:
                fieldSpan ||
                ['fieldset', 'tags', 'file', 'selection'].includes(f.type) ||
                (f as StringField).multiline,
            }),
          )}
          disabled={disabled}
          display={display}
          error={errors?.[f.name]}
          field={f}
          formValues={formValues}
          key={f.name}
          name={name ? `${name}.${f.name}` : f.name}
          onChange={handleChange}
        />
      ))}
    </div>
  ) as ComponentChildren as VNode;
}
