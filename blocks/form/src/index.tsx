import { bootstrap } from '@appsemble/preact';
import { Button, Form, FormButtons, Message } from '@appsemble/preact-components';
import { type ActionError } from '@appsemble/types';
import { identity } from '@appsemble/utils';
import classNames from 'classnames';
import { recursive } from 'merge';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

import { FormInput } from './components/FormInput/index.js';
import styles from './index.module.css';
import { debounce } from './utils/debounce.js';
import { generateDefaultValidity } from './utils/generateDefaultValidity.js';
import { generateDefaultValues } from './utils/generateDefaultValues.js';
import { isFormValid } from './utils/validity.js';
import { type FieldEventParameters, type StringField, type Values } from '../block.js';

bootstrap(
  ({
    actions,
    data,
    events,
    parameters: {
      autofill,
      dense = true,
      disableDefault = false,
      disabled,
      display = 'flex',
      fields: initialFields,
      fullWidth = false,
      previous,
      requirements,
      skipInitialLoad = false,
      title,
    },
    path,
    ready,
    utils,
  }) => {
    const initialLoad = useRef(true);
    const [fields, setFields] = useState(initialFields ?? []);
    const defaultValues = useMemo<Values>(() => {
      const valuesFromData = generateDefaultValues(fields);

      if (disableDefault) {
        return valuesFromData;
      }

      return { ...valuesFromData, ...(data as Record<string, unknown>) };
    }, [data, disableDefault, fields]);
    const [formErrors, setFormErrors] = useState(
      Array.from<string>({ length: requirements?.length ?? 0 }).fill(null),
    );
    const [submitErrorResult, setSubmitErrorResult] = useState<string>(null);
    const [dataLoading, setDataLoading] = useState(!skipInitialLoad);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [values, setValues] = useState(defaultValues);
    const [lastChanged, setLastChanged] = useState<string>(null);
    const errors = useMemo(
      () =>
        generateDefaultValidity(
          fields,
          values,
          utils,
          utils.formatMessage('invalidLabel'),
          defaultValues,
        ),
      [defaultValues, fields, utils, values],
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
        ({ alwaysValidate, isValid }) =>
          alwaysValidate || (isValid.includes(lastChanged) && isFormValid(errors, isValid)),
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
                  ? (utils.remap(requirement.errorMessage, values, {
                      error: errorResponse,
                    }) as string)
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
          .onSubmit({ ...(data as Record<string, unknown>), ...values })
          .catch((submitActionError: unknown) => {
            // Log the error to the console for troubleshooting.
            // eslint-disable-next-line no-console
            console.error(submitActionError);

            let error = '';
            if (typeof submitActionError === 'string') {
              error = submitActionError;
              // If the error is an object we expect an axios response object
              // And we need to retrieve the deeply nested error message
              // First check if object is in expected shape
            } else if (typeof submitActionError === 'object' && submitActionError != null) {
              // Property names of the nested object
              const propertyNames = ['response', 'data', 'data', 'errors'];
              let nestedObj: any = { ...((submitActionError as ActionError).cause as Error) };

              // Check if the object contains all those props
              const objHasProps = (properties: string[]): boolean => {
                for (const prop of properties) {
                  if (!Object.hasOwn(nestedObj, prop)) {
                    return false;
                  }
                  // The nested object become the new object
                  // This is repeated until the last object, which contains the array of errors
                  nestedObj = nestedObj[prop];

                  if (nestedObj instanceof ArrayBuffer) {
                    nestedObj = JSON.parse(
                      new TextDecoder('utf8').decode(new Uint8Array(nestedObj as ArrayBuffer)),
                    );
                  }
                }
                return true;
              };

              // Expected structure is an array of errors
              // Check to avoid exceptions otherwise
              if (
                objHasProps(propertyNames) &&
                Array.isArray(nestedObj) &&
                nestedObj.length > 0 &&
                'property' in nestedObj[0]
              ) {
                // Switch statement to determine the source of the error
                switch (nestedObj[0].property) {
                  // In case of non-conforming email format
                  case 'instance.email':
                    error =
                      'message' in nestedObj[0]
                        ? `'${nestedObj[0].instance}' ${nestedObj[0].message}`
                        : `'${nestedObj[0].instance}' does NOT conform to the email format.`;
                    break;
                  default:
                    // Sets the cumulative stack message from the error object as the error
                    error = nestedObj[0].message;
                    break;
                }
              }
            }
            // Default message if not error is not set
            error = error === '' ? utils.formatMessage('submitError') : error;
            setSubmitErrorResult(error);
          })
          .finally(() => setSubmitting(false));
      }
    }, [actions, data, errors, fields, formErrors, submitting, utils, values]);

    const onPrevious = useCallback(() => {
      actions.onPrevious(values);
    }, [actions, values]);

    useEffect(() => {
      const receiveFields = (d: FieldEventParameters): void => {
        setFieldsLoading(true);
        setFields(d.fields);

        const newDefaultValues = generateDefaultValues(d.fields);

        if (d.keepValues) {
          setValues((currentValues) =>
            recursive(true, newDefaultValues, d.initialValues, currentValues),
          );
        } else {
          setValues(recursive(true, newDefaultValues, d.initialValues));
        }
        setSubmitErrorResult(null);
        setFieldsLoading(!d.fields?.length);
      };

      const hasFieldsEvent = events.on.fields(receiveFields);
      if (hasFieldsEvent && !initialFields) {
        setFieldsLoading(true);
      }

      return () => events.off.fields(receiveFields);
    }, [events, initialFields]);

    const receiveData = useCallback(
      (d: Values) => {
        const newValues = { ...defaultValues, ...d };
        setDataLoading(false);
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
                    ? (utils.remap(requirement.errorMessage, newValues, {
                        error: errorResponse,
                      }) as string)
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

    const debouncedRequest = useMemo(
      () =>
        debounce(async (fieldValues: Values) => {
          await actions[autofill.action](fieldValues).then((response) => {
            if (typeof response === 'object' && !Array.isArray(response)) {
              const newValues = response as Record<string, unknown>;
              for (const [key] of Object.entries(newValues)) {
                newValues[key] ??= defaultValues[key];
              }
              setValues((prevValues) => ({ ...prevValues, ...newValues }));
              setLastChanged(null);
            }
            // TODO: Handle errors appropriately
          }, identity);
        }, autofill?.delay),
      [actions, defaultValues, autofill],
    );

    useEffect(() => {
      if (autofill?.names.includes(lastChanged)) {
        debouncedRequest(values);
      }
    }, [lastChanged, debouncedRequest, values, autofill]);

    useEffect(() => {
      // If a listener is present, wait until data has been received
      const hasListener = events.on.data(receiveData);
      if (!skipInitialLoad || !initialLoad.current) {
        setDataLoading(hasListener);
      } else {
        initialLoad.current = false;
      }
      ready();
    }, [events, ready, receiveData, skipInitialLoad]);

    const loading = dataLoading || fieldsLoading;

    const getFieldsContainerClass = (): string => {
      switch (display) {
        case 'flex':
          return classNames({
            [styles.wrapper]: fields.some((f: any) => f?.inline),
          });
        case 'grid':
          return classNames({
            [styles['wrapper-grid']]: true,
          });
        default:
          return classNames({
            [styles.wrapper]: fields.some((f: any) => f?.inline),
          });
      }
    };

    return (
      <Form
        className={`${fullWidth ? styles['root-full-width'] : styles.root} is-flex`}
        data-path={path}
        onSubmit={onSubmit}
      >
        {loading ? <progress className="progress is-small is-primary" /> : null}
        {title ? <div className="title">{title}</div> : null}
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
        <div className={getFieldsContainerClass()}>
          {fields
            .filter((f) => f.show === undefined || utils.remap(f.show, values))
            .map((f) => (
              <FormInput
                className={`mb-4 ${classNames({
                  [styles.dense]: dense,
                  [styles['column-span']]:
                    ['fieldset', 'tags', 'file'].includes(f.type) || (f as StringField).multiline,
                })}`}
                disabled={
                  dataLoading ||
                  submitting ||
                  Boolean(utils.remap(f.disabled, values[f.name], { values }))
                }
                display={display}
                error={errors[f.name]}
                field={f}
                formValues={values}
                key={f.name}
                name={f.name}
                onChange={onChange}
                readOnly={Boolean(utils.remap(f.readOnly, values[f.name], { values }))}
              />
            ))}
        </div>
        <FormButtons className="mt-2">
          {previous ? (
            <Button className="mr-4" disabled={dataLoading || submitting} onClick={onPrevious}>
              {utils.formatMessage('previousLabel')}
            </Button>
          ) : null}
          <Button
            color="primary"
            disabled={Boolean(
              loading ||
                submitting ||
                formErrors.some(Boolean) ||
                !isFormValid(errors) ||
                utils.remap(disabled, values),
            )}
            type="submit"
          >
            {utils.formatMessage('submitLabel')}
          </Button>
        </FormButtons>
      </Form>
    );
  },
);
