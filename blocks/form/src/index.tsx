import { bootstrap } from '@appsemble/preact';
import { Button, Form, FormButtons, Message } from '@appsemble/preact-components';
import classNames from 'classnames';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { Values } from '../block';
import { FormInput } from './components/FormInput';
import styles from './index.module.css';
import { generateDefaultValidity } from './utils/generateDefaultValidity';
import { generateDefaultValues } from './utils/generateDefaultValues';
import { isFormValid } from './utils/validity';

bootstrap(
  ({ actions, data, events, parameters: { fields, previous, requirements }, ready, utils }) => {
    const defaultValues = useMemo<Values>(
      () => ({ ...generateDefaultValues(fields), ...data }),
      [data, fields],
    );

    const [formErrors, setFormErrors] = useState(
      Array.from<string>({ length: requirements?.length ?? 0 }).fill(null),
    );
    const [submitErrorResult, setSubmitErrorResult] = useState<string>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [values, setValues] = useState(defaultValues);
    const [lastChanged, setLastChanged] = useState<string>(null);
    const errors = useMemo(
      () => generateDefaultValidity(fields, values, utils, utils.formatMessage('invalidLabel')),
      [fields, utils, values],
    );

    const lock = useRef<symbol>();

    const onChange = useCallback((name: string, value: Values) => {
      setValues((oldValues) => ({ ...oldValues, [name]: value }));
      setLastChanged(name);
      setSubmitErrorResult(null);
    }, []);

    useEffect(() => {
      events.emit.change(values);

      if (!lastChanged) {
        return;
      }

      // Filter requirements whose dependencies haven’t changed and whose dependencies are valid.
      const pendingRequirements = requirements?.filter(
        ({ isValid }) => isValid.includes(lastChanged) && isFormValid(errors, isValid),
      );

      // If there are no pending requirements checks, don’t run asynchronous validation.
      if (!pendingRequirements?.length) {
        return;
      }

      const token = Symbol('Async requirements lock');
      lock.current = token;

      const requirementErrors = new Map<number, string>();
      Promise.all(
        pendingRequirements.map((requirement) =>
          actions[requirement.action](values).then(
            (result) => {
              requirementErrors.set(requirements.indexOf(requirement), null);
              return result;
            },
            (errorResponse) => {
              requirementErrors.set(
                requirements.indexOf(requirement),
                requirement.errorMessage
                  ? utils.remap(requirement.errorMessage, values, { error: errorResponse })
                  : utils.formatMessage('formRequirementError'),
              );
            },
          ),
        ),
      ).then((patchedValues) => {
        if (lock.current !== token) {
          return;
        }
        setValues((oldValues) => Object.assign({}, oldValues, ...patchedValues));
        setLastChanged(null);
        setFormErrors((oldErrors) =>
          oldErrors.map((old, index) =>
            requirementErrors.has(index) ? requirementErrors.get(index) : old,
          ),
        );
      });
    }, [actions, errors, events, lastChanged, requirements, utils, values]);

    const onSubmit = useCallback(() => {
      if (!submitting) {
        setSubmitting(true);
        const keys = fields.map((field) => field.name);

        if (!isFormValid(errors, keys) || formErrors.some(Boolean)) {
          setSubmitting(false);
          return;
        }

        actions
          .onSubmit(values)
          .catch((submitActionError: unknown) => {
            // Log the error to the console for troubleshooting.
            // eslint-disable-next-line no-console
            console.error(submitActionError);
            const error =
              typeof submitActionError === 'string'
                ? submitActionError
                : utils.formatMessage('submitError');
            setSubmitErrorResult(error);
          })
          .finally(() => setSubmitting(false));
      }
    }, [actions, errors, fields, formErrors, submitting, utils, values]);

    const onPrevious = useCallback(() => {
      actions.onPrevious(values);
    }, [actions, values]);

    const receiveData = useCallback(
      (d: Values) => {
        const newValues = { ...defaultValues, ...d };
        setLoading(false);
        setValues(newValues);

        const requirementErrors = new Map<number, string>();
        Promise.all(
          requirements?.map((requirement) =>
            actions[requirement.action](newValues).then(
              () => requirementErrors.set(requirements.indexOf(requirement), null),
              (errorResponse) => {
                requirementErrors.set(
                  requirements.indexOf(requirement),
                  requirement.errorMessage
                    ? utils.remap(requirement.errorMessage, newValues, { error: errorResponse })
                    : utils.formatMessage('formRequirementError'),
                );
              },
            ),
          ) ?? [],
        ).then((patchedValues) => {
          setValues((oldValues) => Object.assign({}, oldValues, ...patchedValues));
          setFormErrors((oldErrors) =>
            oldErrors.map((old, index) =>
              requirementErrors.has(index) ? requirementErrors.get(index) : old,
            ),
          );
        });
      },
      [actions, defaultValues, requirements, utils],
    );

    useEffect(() => {
      events.emit.change(values);
    }, [events, values]);

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
          className={classNames(styles.error, { [styles.hidden]: !formErrors.some(Boolean) })}
          color="danger"
        >
          {/* Render the first form error */}
          <span>{formErrors.find(Boolean)}</span>
        </Message>
        <Message
          className={classNames(styles.error, { [styles.hidden]: submitErrorResult == null })}
          color="danger"
        >
          <span>{submitErrorResult}</span>
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
          {previous && (
            <Button className="mr-4" disabled={loading || submitting} onClick={onPrevious}>
              {utils.formatMessage('previousLabel')}
            </Button>
          )}
          <Button
            color="primary"
            disabled={loading || submitting || formErrors.some(Boolean) || !isFormValid(errors)}
            type="submit"
          >
            {utils.formatMessage('submitLabel')}
          </Button>
        </FormButtons>
      </Form>
    );
  },
);
