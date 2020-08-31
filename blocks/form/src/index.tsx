import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Button, FormButtons, Message } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import type { BaseRequirement } from '../block';
import { BooleanInput } from './components/BooleanInput';
import { EnumInput } from './components/EnumInput';
import { FileInput } from './components/FileInput';
import { GeoCoordinatesInput } from './components/GeoCoordinatesInput';
import { NumberInput } from './components/NumberInput';
import { RadioInput } from './components/RadioInput';
import { StringInput } from './components/StringInput';
import styles from './index.css';
import { messages } from './messages';
import { generateDefaultValidity } from './utils/generateDefaultValidity';
import { generateDefaultValues } from './utils/generateDefaultValues';
import { validators } from './utils/validators';

const inputs = {
  enum: EnumInput,
  file: FileInput,
  geocoordinates: GeoCoordinatesInput,
  hidden: (): null => null,
  string: StringInput,
  number: NumberInput,
  integer: NumberInput,
  boolean: BooleanInput,
  radio: RadioInput,
};

bootstrap(({ actions, data, events, parameters, ready, utils: { remap } }) => {
  const [errors, setErrors] = useState<{ [name: string]: string }>({});
  const [formError, setFormError] = useState<string>(null);
  const [disabled, setDisabled] = useState(true);
  const [validity, setValidity] = useState(generateDefaultValidity(parameters, data || {}));
  const [submitting, setSubmitting] = useState(false);
  const defaultValues = useMemo(() => generateDefaultValues(parameters), [parameters]);
  const [values, setValues] = useState({
    ...defaultValues,
    ...data,
  });
  const ref = useRef<unknown>({});

  const validateField = useCallback(
    (event: Event, value: unknown): BaseRequirement => {
      const { fields } = parameters;
      const { name } = event.currentTarget as HTMLInputElement;
      const field = fields.find((f) => f.name === name);

      if (Object.hasOwnProperty.call(validators, field.type)) {
        return validators[field.type](field, value) as BaseRequirement;
      }

      return null;
    },
    [parameters],
  );

  const validateForm = useCallback(
    async (v: unknown, currentValidity: { [field: string]: boolean }, lock: object) => {
      const requirements = parameters.requirements || [];
      let e = null;

      const newData = await Promise.all(
        requirements.map(async (requirement) => {
          try {
            if (requirement.isValid.every((field) => currentValidity[field])) {
              return await actions[requirement.action].dispatch(v);
            }

            return null;
          } catch (error: unknown) {
            e = remap(requirement.errorMessage, v) || messages.requirementError;
            return error;
          }
        }),
      );

      if (lock !== ref.current) {
        return;
      }

      const newValues = Object.assign({}, v, ...newData);
      const newValidity = Object.fromEntries(
        parameters.fields.map((field) => [
          field.name,
          !validators[field.type](field, newValues[field.name]),
        ]),
      );
      setValues(newValues);
      setFormError(e ?? null);
      setValidity(newValidity);
    },
    [actions, ref, parameters, remap],
  );

  const onChange = useCallback(
    (event: Event, value: unknown): void => {
      const { name } = event.currentTarget as HTMLInputElement;
      const invalid = validateField(event, value);
      const error = (invalid != null && remap(invalid.errorMessage, value)) || messages.error;
      setErrors({ ...errors, [name]: invalid && error });
      const newValues = {
        ...values,
        [name]: value,
      };
      const newValidity = { ...validity, [name]: !invalid };
      setValidity(newValidity);
      const lock = {};
      setValues(newValues);
      ref.current = lock;
      validateForm(newValues, newValidity, lock);
    },

    [errors, remap, validateField, validateForm, validity, values],
  );

  const onSubmit = useCallback(
    (event: Event): void => {
      event.preventDefault();

      if (!submitting) {
        setSubmitting(true);
        actions.onSubmit
          .dispatch(values)
          .catch((error) => {
            if (error.message !== 'Schema Validation Failed') {
              throw error;
            }
            setErrors(error.data);
          })
          .finally(() => setSubmitting(false));
      }
    },
    [actions, submitting, values],
  );

  const onPrevious = useCallback(() => {
    actions.onPrevious.dispatch(values);
  }, [actions, values]);

  const receiveData = useCallback(
    (d: { [key: string]: unknown }) => {
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
    <form className={`${styles.root} is-flex px-2 py-2`} noValidate onSubmit={onSubmit}>
      {disabled && <progress className="progress is-small is-primary" />}
      <Message className={classNames(styles.error, { [styles.hidden]: !formError })} color="danger">
        <span>{formError}</span>
      </Message>
      {parameters.fields.map((field) => {
        const Comp = inputs[field.type];
        return (
          <Comp
            // @ts-expect-error XXX This shouldn’t be necessary
            disabled={disabled}
            // @ts-expect-error XXX This shouldn’t be necessary
            error={errors[field.name]}
            // @ts-expect-error XXX This shouldn’t be necessary
            field={field}
            // @ts-expect-error XXX This shouldn’t be necessary
            key={field.name}
            // @ts-expect-error XXX This shouldn’t be necessary
            onInput={onChange}
            // @ts-expect-error XXX This shouldn’t be necessary
            value={values[field.name]}
          />
        );
      })}
      <FormButtons className="mt-4">
        {parameters.previousLabel && (
          <Button className="mr-4" onClick={onPrevious}>
            {remap(parameters.previousLabel, {})}
          </Button>
        )}
        <Button
          color="primary"
          disabled={!Object.values(validity).every((v) => v) || submitting || disabled}
          type="submit"
        >
          {remap(parameters.submitLabel, {}) || <FormattedMessage id="submit" />}
        </Button>
      </FormButtons>
    </form>
  );
}, messages);
