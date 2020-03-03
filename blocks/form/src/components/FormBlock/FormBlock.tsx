/** @jsx h */
import { BlockProps, FormattedMessage } from '@appsemble/preact';
import classNames from 'classnames';
import { h, VNode } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';

import { Field, FileField } from '../../../block';
import BooleanInput from '../BooleanInput';
import EnumInput from '../EnumInput';
import FileInput from '../FileInput';
import GeoCoordinatesInput from '../GeoCoordinatesInput';
import NumberInput from '../NumberInput';
import StringInput from '../StringInput';
import styles from './FormBlock.css';

interface Values {
  [key: string]: any;
}

type Validator = (field: Field, event: Event, value: any) => boolean;

const inputs = {
  enum: EnumInput,
  file: FileInput,
  geocoordinates: GeoCoordinatesInput,
  hidden: (): null => null,
  string: StringInput,
  number: NumberInput,
  integer: NumberInput,
  boolean: BooleanInput,
};

const validateInput: Validator = (_field, event) =>
  (event.target as HTMLInputElement).validity.valid;

const validators: { [name: string]: Validator } = {
  file: (field: FileField, _event, value) => {
    if (!field.required) {
      return true;
    }

    if (field.accept) {
      if (field.repeated) {
        return (
          (value as File[]).every(file => field.accept.includes(file.type)) &&
          (value as File[]).length >= 1
        );
      }
      return field.accept.includes((value as File).type);
    }

    return true;
  },
  geocoordinates: (_, _event, value: { longitude: number; latitude: number }) =>
    !!(value.latitude && value.longitude),
  hidden: (): boolean => true,
  string: validateInput,
  number: validateInput,
  integer: validateInput,
  boolean: () => true,
};

export default function FormBlock({ actions, block, data, events }: BlockProps): VNode {
  const [errors, setErrors] = useState<{ [name: string]: string }>({});
  const [disabled, setDisabled] = useState(!!block.events?.listen?.data);
  const [validity, setValidity] = useState({
    ...block.parameters.fields.reduce<{ [name: string]: boolean }>(
      (acc, { defaultValue, name, required, type }) => {
        let valid = !required;
        if (required) {
          valid = defaultValue !== undefined;
        }
        if ((type as any) === 'boolean') {
          valid = true;
        }
        acc[name] = valid;
        return acc;
      },
      {},
    ),
  });
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState({
    ...block.parameters.fields.reduce<Values>(
      (acc, { defaultValue, name, repeated }: FileField) => {
        acc[name] = defaultValue !== undefined ? defaultValue : repeated && [];
        return acc;
      },
      {},
    ),
    ...data,
  });

  const validateField = useCallback(
    (event: Event, value: any): boolean => {
      const { fields } = block.parameters;
      const { name } = event.target as HTMLInputElement;
      const field = fields.find(f => f.name === name);

      if (Object.prototype.hasOwnProperty.call(validators, field.type)) {
        return validators[field.type](field, event, value);
      }
      return true;
    },
    [block],
  );

  const onChange = useCallback(
    (event: Event, value: any): void => {
      const { name } = event.target as HTMLInputElement;
      const valid = validateField(event, value);

      setErrors({ ...errors, [name]: valid ? null : 'Invalid' });
      setValidity({ ...validity, [name]: valid });
      setValues({
        ...values,
        [(event.target as HTMLInputElement).name]: value,
      });
    },
    [errors, validateField, validity, values],
  );

  const onSubmit = useCallback(
    (event: Event): void => {
      event.preventDefault();

      if (!submitting) {
        actions.onSubmit
          .dispatch(values)
          .then(() => {
            setSubmitting(true);
            return actions.onSubmitSuccess.dispatch(values);
          })
          .catch(error => {
            if (error.message !== 'Schema Validation Failed') {
              setSubmitting(false);
              throw error;
            }
            setErrors(error.data);
            setSubmitting(false);
          });
      }

      setSubmitting(true);
    },
    [actions, submitting, values],
  );

  const receiveData = useCallback((d: any) => {
    setDisabled(false);
    setValues(d);
  }, []);

  useEffect(() => {
    events.on.data(receiveData);
  }, [block, events, receiveData]);

  return (
    <form className={styles.root} noValidate onSubmit={onSubmit}>
      {disabled && <progress className="progress is-small is-primary" />}
      {block.parameters.fields.map(field => {
        const Comp = inputs[field.type];
        return (
          <Comp
            key={field.name}
            disabled={disabled}
            error={errors[field.name]}
            // @ts-ignore
            field={field}
            onInput={onChange}
            // @ts-ignore
            value={values[field.name]}
          />
        );
      })}
      <div className={styles.buttonWrapper}>
        <button
          className={classNames('button', 'is-primary', styles.submit)}
          disabled={!Object.values(validity).every(v => v) || submitting || disabled}
          type="submit"
        >
          <FormattedMessage id="submit" />
        </button>
      </div>
    </form>
  );
}
