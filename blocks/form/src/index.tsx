import { bootstrap } from '@appsemble/preact';
import { Button, Form, FormButtons, Message } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { Values } from '../block';
import { FormInput } from './components/FormInput';
import styles from './index.css';
import { generateDefaultValidity } from './utils/generateDefaultValidity';
import { generateDefaultValues } from './utils/generateDefaultValues';
import { isFormValid } from './utils/validity';

bootstrap(
  ({
    actions,
    data,
    events,
    parameters: {
      fields,
      formRequirementError = 'One of the requirements of this form is invalid.',
      previousLabel,
      requirements,
      submitError = 'There was a problem submitting this form',
      submitLabel = 'Submit',
    },
    ready,
    utils,
  }) => {
    const defaultValues = useMemo<Values>(() => ({ ...generateDefaultValues(fields), ...data }), [
      data,
      fields,
    ]);

    const [formError, setFormError] = useState<string>(null);
    const [hasSubmitError, setSubmitError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [values, setValues] = useState(defaultValues);
    const errors = useMemo(() => generateDefaultValidity(fields, values, utils), [
      fields,
      utils,
      values,
    ]);

    const lock = useRef<symbol>();

    const onChange = useCallback(
      async (name: string, value: Values) => {
        setValues((oldValues) => ({ ...oldValues, [name]: value }));
        events.emit.change(value);

        if (!requirements?.length) {
          return;
        }

        const token = Symbol('Async requirements lock');
        lock.current = token;

        let error;
        const err = generateDefaultValidity(fields, value, utils);
        const patchedValues = await Promise.all(
          requirements.map(async (requirement) => {
            if (!isFormValid(err, requirement.isValid)) {
              return;
            }
            try {
              return await actions[requirement.action].dispatch(value);
            } catch (errorResponse: unknown) {
              error = utils.remap(requirement.errorMessage ?? formRequirementError, value, {
                error: errorResponse,
              });
            }
          }),
        );

        if (lock.current !== token) {
          return;
        }
        const newValues = Object.assign({}, value, ...patchedValues);
        events.emit.change(newValues);
        setValues(newValues);
        setFormError(error);
      },
      [actions, events, fields, formRequirementError, requirements, utils],
    );

    const onSubmit = useCallback(() => {
      if (!submitting) {
        setSubmitting(true);
        actions.onSubmit
          .dispatch(values)
          .catch((error) => {
            // Log the error to the console for troubleshooting.
            // eslint-disable-next-line no-console
            console.error(error);
            setSubmitError(true);
          })
          .finally(() => setSubmitting(false));
      }
    }, [actions, submitting, values]);

    const onPrevious = useCallback(() => {
      actions.onPrevious.dispatch(values);
    }, [actions, values]);

    const receiveData = useCallback(
      (d: Values) => {
        const newValues = { ...defaultValues, ...d };
        setLoading(false);
        setValues(newValues);
      },
      [defaultValues],
    );

    useEffect(() => {
      // If a listener is present, wait until data has been received
      const hasListener = events.on.data(receiveData);
      setLoading(hasListener);
      ready();
    }, [events, ready, receiveData]);

    return (
      <Form className={`${styles.root} is-flex px-2 py-2`} onSubmit={onSubmit}>
        {loading && <progress className="progress is-small is-primary" />}
        <Message
          className={classNames(styles.error, { [styles.hidden]: !formError })}
          color="danger"
        >
          <span>{formError}</span>
        </Message>
        <Message
          className={classNames(styles.error, { [styles.hidden]: !hasSubmitError })}
          color="danger"
        >
          <span>{utils.remap(submitError, values)}</span>
        </Message>
        {fields.map((f) => (
          <FormInput
            disabled={loading || submitting}
            error={errors[f.name]}
            field={f}
            key={f.name}
            name={f.name}
            onChange={onChange}
            value={values[f.name]}
          />
        ))}
        <FormButtons className="mt-4">
          {previousLabel && (
            <Button className="mr-4" disabled={loading || submitting} onClick={onPrevious}>
              {utils.remap(previousLabel, {})}
            </Button>
          )}
          <Button
            color="primary"
            disabled={loading || submitting || Boolean(formError) || !isFormValid(errors)}
            type="submit"
          >
            {utils.remap(submitLabel, {})}
          </Button>
        </FormButtons>
      </Form>
    );
  },
);
