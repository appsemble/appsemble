import { bootstrap } from '@appsemble/preact';
import { Button, FormButtons, Message } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import type { BaseRequirement } from '../block';
import { FormInput } from './components/FormInput';
import styles from './index.css';
import { generateDefaultValidity } from './utils/generateDefaultValidity';
import { generateDefaultValues } from './utils/generateDefaultValues';
import { validators } from './utils/validators';

bootstrap(({ actions, data, events, parameters, ready, utils: { remap } }) => {
  const defaultValues = useMemo(() => generateDefaultValues(parameters), [parameters]);
  const defaultValidity = useMemo(
    () => generateDefaultValidity(parameters, { ...defaultValues, ...data }),
    [parameters, defaultValues, data],
  );
  const [errors, setErrors] = useState<{ [name: string]: string }>({});
  const [formError, setFormError] = useState<string>(null);
  const [disabled, setDisabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validity, setValidity] = useState(defaultValidity);
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
            e = remap(
              requirement.errorMessage ??
                remap(
                  parameters.formRequirementError ??
                    'One of the requirements of this form is invalid.',
                  {},
                ),
              v,
            );
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
          Object.hasOwnProperty.call(validators, field.type)
            ? !validators[field.type](field, newValues[field.name])
            : true,
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
      const error =
        (invalid != null && remap(invalid.errorMessage, value)) ||
        remap(
          parameters?.fieldErrorLabel ?? 'One of the requirements of this field is invalid.',
          value,
        );
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

    [errors, parameters, remap, validateField, validateForm, validity, values],
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
      {parameters.fields.map((field) => (
        <FormInput
          disabled={disabled}
          error={errors[field.name]}
          field={field}
          key={field.name}
          onInput={onChange}
          value={values[field.name]}
        />
      ))}
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
          {remap(parameters.submitLabel || 'Submit', {})}
        </Button>
      </FormButtons>
    </form>
  );
});
