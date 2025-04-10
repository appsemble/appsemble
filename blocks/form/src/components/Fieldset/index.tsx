import { useBlock } from '@appsemble/preact';
import { Button, FormButtons } from '@appsemble/preact-components';
import classNames from 'classnames';
import { type JSX, type VNode } from 'preact';
import { type MutableRef, useCallback } from 'preact/hooks';

import styles from './index.module.css';
import {
  type FieldError,
  type Fieldset as FieldsetType,
  type FormDisplay,
  type InputProps,
  type StringField,
  type Values,
} from '../../../block.js';
import { generateDefaultValues } from '../../utils/generateDefaultValues.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { getMaxLength, getMinLength } from '../../utils/requirements.js';
import { FieldsetEntry } from '../FieldsetEntry/index.js';

interface FieldsetProps extends InputProps<Values | Values[], FieldsetType> {
  readonly display?: FormDisplay;
  readonly setFieldErrorLink?: (
    fieldName: string,
    params: { ref: MutableRef<any>; error: string; label: string },
  ) => void;
  readonly addThumbnail: (thumbnail: File) => void;
  readonly removeThumbnail: (thumbnail: File) => void;
}

/**
 * An input element for a fieldset
 */
export function Fieldset({
  addThumbnail,
  className,
  disabled,
  display = 'flex',
  error,
  errorLinkRef,
  field,
  formValues,
  name,
  onChange,
  readOnly,
  removeThumbnail,
  setFieldErrorLink,
}: FieldsetProps): VNode {
  const { utils } = useBlock();
  const localValues = getValueByNameSequence(name, formValues) as Values[];
  const errors = error as FieldError[];
  const minLength = getMinLength(field);
  const maxLength = getMaxLength(field);

  const changeArray = useCallback(
    (localName: string, val: Values) => {
      const index = Number(localName);
      onChange(
        localName,
        localValues.map((v, i) => (index === i ? val : v)),
      );
    },
    [onChange, localValues],
  );

  const addEntry = useCallback(() => {
    const newEntry = generateDefaultValues(field.fields);
    onChange(field.name, [...(localValues as Values[]), newEntry]);
  }, [field, onChange, localValues]);

  const removeEntry = useCallback(
    (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
      const index = Number(event.currentTarget.name);

      onChange(field.name, localValues.slice(0, index).concat(localValues.slice(index + 1)));
    },
    [field, onChange, localValues],
  );

  const fieldsetSpan = field.fields.some(
    (f) =>
      ['fieldset', 'tags', 'file', 'selection', 'markdown'].includes(f.type) ||
      (f as StringField).multiline,
  );

  return (
    <fieldset
      className={classNames('appsemble-fieldset mb-4', className, styles['fieldset-wrapper'])}
    >
      <div className="is-flex is-justify-content-space-between">
        <div className="title is-5 mb-4">{utils.remap(field.label, localValues) as string}</div>
        {field.repeated && !minLength ? (
          <span className="is-pulled-right has-text-weight-normal">
            {utils.formatMessage('optionalLabel')}
          </span>
        ) : null}
      </div>
      {field.repeated ? (
        <>
          <div className={styles[`fieldset-entries-wrapper-${display}`]}>
            {(localValues || []).map((val, index) => (
              // eslint-disable-next-line react/jsx-key
              <div
                className={classNames('mb-4 box p-3', {
                  [styles['column-span']]: fieldsetSpan,
                })}
              >
                <div className="mb-2 is-flex is-justify-content-end is-align-items-center">
                  {!minLength || localValues.length > minLength ? (
                    <button
                      className="delete"
                      name={String(index)}
                      onClick={removeEntry}
                      type="button"
                    />
                  ) : (
                    <button className="delete is-invisible" type="button" />
                  )}
                </div>
                <FieldsetEntry
                  addThumbnail={addThumbnail}
                  disabled={disabled}
                  display={display}
                  error={errors?.[index]}
                  errorLinkRef={errorLinkRef}
                  field={field}
                  fieldSpan={!fieldsetSpan}
                  formValues={formValues}
                  index={index}
                  name={`${name}.${index}`}
                  onChange={changeArray}
                  removeThumbnail={removeThumbnail}
                  setFieldErrorLink={(fieldName, params) =>
                    setFieldErrorLink(`${field.name}.${index}.${fieldName}`, params)
                  }
                />
              </div>
            ))}
          </div>
          {!readOnly && (!maxLength || localValues.length < maxLength) ? (
            <FormButtons>
              <Button disabled={disabled} icon="plus" onClick={addEntry}>
                {utils.remap(field.addLabel ?? 'Add', localValues) as string}
              </Button>
            </FormButtons>
          ) : null}
        </>
      ) : (
        <FieldsetEntry
          addThumbnail={addThumbnail}
          disabled={disabled}
          error={error}
          errorLinkRef={errorLinkRef}
          field={field}
          formValues={formValues}
          name={name}
          onChange={onChange}
          removeThumbnail={removeThumbnail}
          setFieldErrorLink={setFieldErrorLink}
        />
      )}
    </fieldset>
  );
}
