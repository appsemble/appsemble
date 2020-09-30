import { useBlock } from '@appsemble/preact';
import { Button, FormButtons } from '@appsemble/preact-components';
import { Fragment, h, VNode } from 'preact';
import { useCallback } from 'preact/hooks';

import type { FieldError, FieldErrorMap, InputProps, ObjectField, Values } from '../../../block';
import { generateDefaultValidity } from '../../utils/generateDefaultValidity';
import { generateDefaultValues } from '../../utils/generateDefaultValues';
import { getMaxLength, getMinLength } from '../../utils/requirements';
import { ObjectEntry } from '../ObjectEntry';

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
    (localName: string, val: Values | Values, err: FieldErrorMap) => {
      const index = Number(localName);
      onChange(
        localName,
        values.map((v, i) => (index === i ? val : v)),
        errors.map((e, i) => (index === i ? err : e)),
      );
    },
    [errors, onChange, values],
  );

  const addEntry = useCallback(() => {
    const newEntry = generateDefaultValues(field.fields);
    onChange(
      field.name,
      [...(value as Values[]), newEntry],
      [...(error as FieldError[]), generateDefaultValidity(field.fields, newEntry, utils)],
    );
  }, [error, field, onChange, utils, value]);

  const removeEntry = useCallback(
    (event: h.JSX.TargetedMouseEvent<HTMLButtonElement>) => {
      const index = Number(event.currentTarget.name);

      onChange(
        field.name,
        values.slice(0, index).concat(values.slice(index + 1)),
        errors.slice(0, index).concat(errors.slice(index + 1)),
      );
    },
    [errors, field, onChange, values],
  );

  return (
    <fieldset className="appsemble-object">
      <legend className="title is-5">{utils.remap(field.label, value)}</legend>
      {field.repeated ? (
        <Fragment>
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
              {(!minLength || values.length > minLength) && (
                <FormButtons>
                  <Button icon="minus" name={String(index)} onClick={removeEntry}>
                    {utils.remap(field.removeLabel ?? 'Remove', val)}
                  </Button>
                </FormButtons>
              )}
            </div>
          ))}
          {(!maxLength || values.length < maxLength) && (
            <FormButtons className="mt-2">
              <Button icon="plus" onClick={addEntry}>
                {utils.remap(field.addLabel ?? 'Add', value)}
              </Button>
            </FormButtons>
          )}
        </Fragment>
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
