import { bootstrap, FormattedMessage } from '@appsemble/preact';
import type { Remapper } from '@appsemble/sdk';
import classNames from 'classnames';
import { h } from 'preact';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';

import type { Field, FileField, StringField } from '../block';
import BooleanInput from './components/BooleanInput';
import EnumInput from './components/EnumInput';
import FileInput from './components/FileInput';
import GeoCoordinatesInput from './components/GeoCoordinatesInput';
import NumberInput from './components/NumberInput';
import StringInput from './components/StringInput';
import styles from './index.css';
import ValidationError from './utils/ValidationError';

type Validator = (
  field: Field,
  event: Event,
  value: any,
  remap: (remapper: Remapper, data: any) => any,
) => boolean;

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

const validateString: Validator = (field: StringField, event, value: string, remap) => {
  const inputValid = (event.target as HTMLInputElement).validity.valid;

  if (!inputValid) {
    return false;
  }

  field.requirements?.forEach((requirement) => {
    let valid = true;

    if ('regex' in requirement) {
      const regex = new RegExp(requirement.regex, requirement.flags || 'g');
      valid = regex.test(value);
    }

    if ('maxLength' in requirement || 'minLength' in requirement) {
      let maxValid = true;
      let minValid = true;
      const inclusive = requirement.inclusive ?? true;

      if (requirement.maxLength != null) {
        maxValid = inclusive
          ? value.length >= requirement.maxLength
          : value.length > requirement.maxLength;
      }
      if (requirement.minLength != null) {
        minValid = inclusive
          ? value.length <= requirement.minLength
          : value.length < requirement.minLength;
      }

      valid = maxValid && minValid;
    }

    if (!valid) {
      const error = remap(requirement.errorMessage, value);
      throw new ValidationError(error);
    }
  });

  return inputValid;
};

const validateInput: Validator = (_field, event) =>
  (event.target as HTMLInputElement).validity.valid;

const validators: { [name: string]: Validator } = {
  file: (field: FileField, _event, value) => {
    if (!field.required) {
      return true;
    }

    if (value === null) {
      return false;
    }

    if (field.accept) {
      if (field.repeated) {
        return (
          (value as File[]).every((file) => field.accept.includes(file.type)) &&
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
  string: validateString,
  number: validateInput,
  integer: validateInput,
  boolean: () => true,
};

const messages = {
  invalid: 'This value is invalid',
  emptyFileLabel: ' ',
  submit: 'Submit',
  unsupported: 'This file type is not supported',
};

bootstrap(({ actions, data, events, parameters, ready, utils: { remap } }) => {
  const [errors, setErrors] = useState<{ [name: string]: string }>({});
  const [disabled, setDisabled] = useState(true);
  const [validity, setValidity] = useState({
    ...parameters.fields.reduce<{ [name: string]: boolean }>(
      (acc, { defaultValue, name, readOnly, required, type }) => {
        let valid = !required;
        if (required) {
          valid = defaultValue !== undefined;
        }
        if (readOnly) {
          if (required) {
            valid = !!data[name];
          } else {
            valid = true;
          }
        }
        if (type === 'boolean') {
          valid = true;
        }
        acc[name] = valid;
        return acc;
      },
      {},
    ),
  });
  const [submitting, setSubmitting] = useState(false);
  const defaultValues = useMemo(
    () =>
      parameters.fields.reduce((acc, field) => {
        if ('defaultValue' in field) {
          acc[field.name] = field.defaultValue;
        } else if (field.type === 'string') {
          acc[field.name] = '';
        } else if (field.type === 'boolean') {
          acc[field.name] = false;
        } else if (
          field.type === 'enum' ||
          field.type === 'hidden' ||
          field.type === 'integer' ||
          field.type === 'number'
        ) {
          acc[field.name] = null;
        } else if (field.type === 'geocoordinates') {
          acc[field.name] = {};
        } else if (field.type === 'file' && field.repeated) {
          acc[field.name] = [];
        } else {
          acc[field.name] = null;
        }

        return acc;
      }, {} as { [key: string]: any }),
    [parameters],
  );
  const [values, setValues] = useState({
    ...defaultValues,
    ...data,
  });

  const validateField = useCallback(
    (event: Event, value: any): boolean => {
      const { fields } = parameters;
      const { name } = event.target as HTMLInputElement;
      const field = fields.find((f) => f.name === name);

      if (Object.prototype.hasOwnProperty.call(validators, field.type)) {
        return validators[field.type](field, event, value, remap);
      }
      return true;
    },
    [parameters, remap],
  );

  const onChange = useCallback(
    (event: Event, value: any): void => {
      const { name } = event.target as HTMLInputElement;
      let valid: boolean;
      let error: string;

      try {
        valid = validateField(event, value);
        if (!valid) {
          error = messages.invalid;
        }
      } catch (e) {
        if (!(e instanceof ValidationError)) {
          throw e;
        }

        valid = false;
        error = e.message || messages.invalid;
      }

      setErrors({ ...errors, [name]: error });
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
          .catch((error) => {
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

  const receiveData = useCallback(
    (d: any) => {
      setDisabled(false);
      setValues({ ...defaultValues, ...d });
    },
    [defaultValues],
  );

  useEffect(() => {
    // If a listener is present, wait until data has been received
    const hasListener = events.on.data(receiveData);
    setDisabled(hasListener);
    ready();
  }, [parameters, events, ready, receiveData]);

  return (
    <form className={styles.root} noValidate onSubmit={onSubmit}>
      {disabled && <progress className="progress is-small is-primary" />}
      {parameters.fields.map((field) => {
        const Comp = inputs[field.type];
        return (
          <Comp
            // @ts-expect-error
            key={field.name}
            // @ts-expect-error
            disabled={disabled}
            // @ts-expect-error
            error={errors[field.name]}
            // @ts-expect-error
            field={field}
            // @ts-expect-error
            onInput={onChange}
            // @ts-expect-error
            value={values[field.name]}
          />
        );
      })}
      <div className={styles.buttonWrapper}>
        <button
          className={classNames('button', 'is-primary', styles.submit)}
          disabled={!Object.values(validity).every((v) => v) || submitting || disabled}
          type="submit"
        >
          {parameters.submitLabel || <FormattedMessage id="submit" />}
        </button>
      </div>
    </form>
  );
}, messages);
