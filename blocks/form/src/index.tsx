import { bootstrap } from '@appsemble/preact';
import { Button, Form, FormButtons, Message } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { FieldErrorMap, Values } from '../block';
import { FieldGroup } from './components/FieldGroup';
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
    const defaultValues = useMemo(() => ({ ...generateDefaultValues(fields), ...data }), [
      data,
      fields,
    ]);
    const defaultErrors = useMemo(() => generateDefaultValidity(fields, defaultValues, utils), [
      defaultValues,
      fields,
      utils,
    ]);

    const [formError, setFormError] = useState<string>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [values, setValues] = useState(defaultValues);
    const [errors, setErrors] = useState(defaultErrors);

    const lock = useRef<symbol>();

    const onChange = useCallback(
      async (name: string, value: Values, err: FieldErrorMap) => {
        setValues(value);
        setErrors(err);

        if (!requirements?.length) {
          return;
        }

        const token = Symbol('Async requirements lock');
        lock.current = token;

        let error;
        const patchedValues = await Promise.all(
          requirements.map(async (requirement) => {
            if (!isFormValid(err, requirement.isValid)) {
              return;
            }
            try {
              return await actions[requirement.action].dispatch(value);
            } catch {
              error = utils.remap(
                requirement.errorMessage ?? utils.remap(formRequirementError, {}),
                value,
              );
            }
          }),
        );

        if (lock.current !== token) {
          return;
        }
        const newValues = Object.assign({}, value, ...patchedValues);
        setValues(newValues);
        setErrors(generateDefaultValidity(fields, newValues, utils));
        setFormError(error);
      },
      [actions, fields, formRequirementError, requirements, utils],
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
            setFormError(utils.remap(submitError, values));
          })
          .finally(() => setSubmitting(false));
      }
    }, [actions, submitError, submitting, utils, values]);

    const onPrevious = useCallback(() => {
      actions.onPrevious.dispatch(values);
    }, [actions, values]);

    const receiveData = useCallback(
      (d: Values) => {
        const newValues = { ...defaultValues, ...d };
        setLoading(false);
        setValues(newValues);
        setErrors(generateDefaultValidity(fields, newValues, utils));
      },
      [defaultValues, fields, utils],
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
        <FieldGroup
          disabled={loading || submitting}
          errors={errors}
          fields={fields}
          onChange={onChange}
          value={values}
        />
        <FormButtons className="mt-4">
          {previousLabel && (
            <Button className="mr-4" disabled={loading || submitting} onClick={onPrevious}>
              {utils.remap(previousLabel, {})}
            </Button>
          )}
          <Button
            color="primary"
            disabled={loading || submitting || !isFormValid(errors)}
            type="submit"
          >
            {utils.remap(submitLabel, {})}
          </Button>
        </FormButtons>
      </Form>
    );
  },
);
