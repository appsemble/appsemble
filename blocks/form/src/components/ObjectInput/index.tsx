import { useBlock } from '@appsemble/preact';
import { Button, FormButtons } from '@appsemble/preact-components';
import { JSX, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { FieldError, InputProps, ObjectField, Values } from '../../../block.js';
import { generateDefaultValues } from '../../utils/generateDefaultValues.js';
import { getValueByNameSequence } from '../../utils/getNested.js';
import { getMaxLength, getMinLength } from '../../utils/requirements.js';
import { ObjectEntry } from '../ObjectEntry/index.js';

type ObjectInputProps = InputProps<Values | Values[], ObjectField>;

/**
 * An input element for an object field
 */
export function ObjectInput({
  disabled,
  error,
  field,
  formValues,
  name,
  onChange,
}: ObjectInputProps): VNode {
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

  return (
    <fieldset className="appsemble-object">
      <legend className="title is-5">{utils.remap(field.label, localValues) as string}</legend>
      {field.repeated ? (
        <>
          {(localValues || []).map((val, index) => (
            // eslint-disable-next-line react/jsx-key
            <div>
              <ObjectEntry
                disabled={disabled}
                error={errors?.[index]}
                field={field}
                formValues={formValues}
                index={index}
                name={`${name}.${index}`}
                onChange={changeArray}
              />
              {!minLength || formValues.length > minLength ? (
                <FormButtons>
                  <Button icon="minus" name={String(index)} onClick={removeEntry}>
                    {utils.remap(field.removeLabel ?? 'Remove', val) as string}
                  </Button>
                </FormButtons>
              ) : null}
            </div>
          ))}
          {!maxLength || formValues.length < maxLength ? (
            <FormButtons className="mt-2">
              <Button icon="plus" onClick={addEntry}>
                {utils.remap(field.addLabel ?? 'Add', localValues) as string}
              </Button>
            </FormButtons>
          ) : null}
        </>
      ) : (
        <ObjectEntry
          disabled={disabled}
          error={error}
          field={field}
          formValues={formValues}
          name={name}
          onChange={onChange}
        />
      )}
    </fieldset>
  );
}
