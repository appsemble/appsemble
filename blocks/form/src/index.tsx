import { bootstrap, FormattedMessage } from '@appsemble/preact';
import { Message } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import type { BaseRequirement } from '../block';
import BooleanInput from './components/BooleanInput';
import EnumInput from './components/EnumInput';
import FileInput from './components/FileInput';
import GeoCoordinatesInput from './components/GeoCoordinatesInput';
import NumberInput from './components/NumberInput';
import RadioInput from './components/RadioInput';
import StringInput from './components/StringInput';
import styles from './index.css';
import messages from './messages';
import generateDefaultValues from './utils/generateDefaultValues';
import generateValidity from './utils/generateValidity';
import validators from './utils/validators';

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
  const [validity, setValidity] = useState(generateValidity(parameters, data));
  const [submitting, setSubmitting] = useState(false);
  const defaultValues = useMemo(() => generateDefaultValues(parameters), [parameters]);
  const [values, setValues] = useState({
    ...defaultValues,
    ...data,
  });
  const ref = useRef<object>({});

  const validateField = useCallback(
    (event: Event, value: any): BaseRequirement => {
      const { fields } = parameters;
      const { name } = event.target as HTMLInputElement;
      const field = fields.find((f) => f.name === name);

      if (Object.prototype.hasOwnProperty.call(validators, field.type)) {
        return validators[field.type](field, value, remap);
      }
      return null;
    },
    [parameters, remap],
  );

  const validateForm = useCallback(
    async (v: any, newValidity: { [field: string]: boolean }, lock: object) => {
      const requirements = parameters.requirements || [];
      let e = null;

      const newData = await Promise.all(
        requirements.map(async (requirement) => {
          try {
            if (requirement.isValid.every((field) => newValidity[field])) {
              return await actions[requirement.action].dispatch(v);
            }

            return null;
          } catch (error) {
            e = remap(requirement.errorMessage, v) || messages.error;
            return error;
          }
        }),
      );

      if (lock !== ref.current) {
        return;
      }

      const newValues = Object.assign({}, v, ...newData);
      setValues(newValues);
      setFormError(e ?? null);
    },
    [actions, ref, parameters, remap],
  );

  const onChange = useCallback(
    (event: Event, value: any): void => {
      const { name } = event.target as HTMLInputElement;

      const invalid = validateField(event, value);
      const error = remap(invalid.errorMessage, value) || messages.error;

      setErrors({ ...errors, [name]: invalid && error });
      const newValues = {
        ...values,
        [(event.target as HTMLInputElement).name]: value,
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
      <Message className={classNames(styles.error, { [styles.hidden]: !formError })} color="danger">
        <span>{formError}</span>
      </Message>
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
});
