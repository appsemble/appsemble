import { useBlock } from '@appsemble/preact';
import { Button, FormButtons } from '@appsemble/preact-components';
import { JSX, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import { FieldError, InputProps, ObjectField, Values } from '../../../block.js';
import { generateDefaultValues } from '../../utils/generateDefaultValues.js';
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
  name,
  onChange,
  value,
}: ObjectInputProps): VNode {
  const { utils } = useBlock();
  const values = value as Values[];
  const errors = error as FieldError[];
  const minLength = getMinLength(field);
  const maxLength = getMaxLength(field);

  const changeArray = useCallback(
    (localName: string, val: Values | Values) => {
      const index = Number(localName);
      onChange(
        localName,
        values.map((v, i) => (index === i ? val : v)),
      );
    },
    [onChange, values],
  );

  const addEntry = useCallback(() => {
    const newEntry = generateDefaultValues(field.fields);
    onChange(field.name, [...(value as Values[]), newEntry]);
  }, [field, onChange, value]);

  const removeEntry = useCallback(
    (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => {
      const index = Number(event.currentTarget.name);

      onChange(field.name, values.slice(0, index).concat(values.slice(index + 1)));
    },
    [field, onChange, values],
  );

  return (
    <fieldset className="appsemble-object">
      <legend className="title is-5">{utils.remap(field.label, value) as string}</legend>
      {field.repeated ? (
        <>
          {(values || []).map((val, index) => (
            // eslint-disable-next-line react/jsx-key
            <div>
              <ObjectEntry
                disabled={disabled}
                error={errors[index]}
                field={field}
                index={index}
                name={name}
                onChange={changeArray}
                value={val}
              />
              {!minLength || values.length > minLength ? (
                <FormButtons>
                  <Button icon="minus" name={String(index)} onClick={removeEntry}>
                    {utils.remap(field.removeLabel ?? 'Remove', val) as string}
                  </Button>
                </FormButtons>
              ) : null}
            </div>
          ))}
          {!maxLength || values.length < maxLength ? (
            <FormButtons className="mt-2">
              <Button icon="plus" onClick={addEntry}>
                {utils.remap(field.addLabel ?? 'Add', value) as string}
              </Button>
            </FormButtons>
          ) : null}
        </>
      ) : (
        <ObjectEntry
          disabled={disabled}
          error={error}
          field={field}
          name={name}
          onChange={onChange}
          value={value as Values}
        />
      )}
    </fieldset>
  );
}
