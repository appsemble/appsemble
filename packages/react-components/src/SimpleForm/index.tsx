import React from 'react';
import type { Promisable } from 'type-fest';

import Form from '../Form';

interface SimpleFormProps<T> extends Omit<React.ComponentProps<typeof Form>, 'onSubmit' | 'ref'> {
  children: React.ReactNode;
  defaultValues: T;
  onSubmit: (values: T) => Promisable<void>;
  preprocess?: (name: string, newValues: T, oldValues: T) => T;
  resetOnSuccess?: boolean;
}

interface FormErrors {
  [field: string]: React.ReactNode;
}

interface FormValues {
  [field: string]: any;
}

interface SimpleFormContext {
  formErrors: FormErrors;
  pristine: boolean;
  setFormError: (name: string, errorMessage: React.ReactNode) => void;
  setValue: (name: string, value: any, errorMessage?: React.ReactNode) => void;
  setValues: (values: FormValues) => void;
  submitError?: Error;
  submitting: boolean;
  values: FormValues;
}

const Context = React.createContext<SimpleFormContext>(null);

export default function SimpleForm<T extends {}>({
  children,
  defaultValues,
  onSubmit,
  preprocess,
  resetOnSuccess,
  ...props
}: SimpleFormProps<T>): React.ReactElement {
  const [values, setValues] = React.useState(defaultValues);
  const [submitError, setSubmitError] = React.useState<Error>(null);
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});
  const [pristine, setPristine] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const reset = React.useCallback(() => {
    setValues(defaultValues);
    setPristine(true);
  }, [defaultValues]);

  const doSubmit = React.useCallback(async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(err);
      return;
    } finally {
      setSubmitting(false);
    }
    setSubmitError(null);
    if (resetOnSuccess) {
      reset();
    }
  }, [onSubmit, reset, resetOnSuccess, values]);

  const setFormError = React.useCallback(
    (name: string, errorMessage?: React.ReactNode) => {
      setFormErrors({
        ...formErrors,
        [name]: errorMessage,
      });
    },
    [formErrors],
  );

  const setValue = React.useCallback(
    (name: string, value: any, errorMessage?: React.ReactNode) => {
      setPristine(false);
      let newValues = {
        ...values,
        [name]: value,
      };
      if (preprocess) {
        newValues = preprocess(name, newValues, values);
      }
      setValues(newValues);
      setFormError(name, errorMessage);
    },
    [preprocess, setFormError, values],
  );

  return (
    <Form {...props} onSubmit={doSubmit}>
      <Context.Provider
        value={{
          formErrors,
          pristine,
          setFormError,
          setValue,
          setValues,
          submitError,
          submitting,
          values,
        }}
      >
        {children}
      </Context.Provider>
    </Form>
  );
}

export function useSimpleForm(): SimpleFormContext {
  return React.useContext(Context);
}
