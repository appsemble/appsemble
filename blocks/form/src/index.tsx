import { bootstrap } from '@appsemble/preact';
import { Button, Form, FormButtons, Message } from '@appsemble/preact-components';
import classNames from 'classnames';
import { h } from 'preact';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import type { FieldErrorMap } from '../block';
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
      submitLabel = 'Submit',
    },
    ready,
    utils,
  }) => {
    const defaultValues = useMemo(() => generateDefaultValues(fields), [fields]);
    const defaultErrors = useMemo(() => generateDefaultValidity(fields, defaultValues, utils), [
      defaultValues,
      fields,
      utils,
    ]);

    const [formError, setFormError] = useState<string>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [values, setValues] = useState({ ...defaultValues, ...data });
    const [errors, setErrors] = useState(defaultErrors);

    const lock = useRef<symbol>();

    const onChange = useCallback(
      async (name: string, value: { [key: string]: unknown }, err: FieldErrorMap) => {
        setValues(value);
        setErrors(err);

        if (!requirements?.length) {
          return;
        }

        const token = Symbol();
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
            if (error.message !== 'Schema Validation Failed') {
              throw error;
            }
            setErrors(error.data);
          })
          .finally(() => setSubmitting(false));
      }
    }, [actions, submitting, values]);

    const onPrevious = useCallback(() => {
      actions.onPrevious.dispatch(values);
    }, [actions, values]);

    const receiveData = useCallback(
      (d: { [key: string]: unknown }) => {
        setLoading(false);
        setValues({ ...defaultValues, ...d });
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
