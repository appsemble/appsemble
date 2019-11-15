import React from 'react';
import { Promisable } from 'type-fest';

import Form from '../Form';

interface SimpleFormProps<T> extends Omit<React.ComponentProps<typeof Form>, 'onSubmit' | 'ref'> {
  children: React.ReactNode;
  defaultValues: T;
  onSubmit: (values: T) => Promisable<void>;
  resetOnSuccess?: boolean;
}

interface SimpleFormContext {
  formErrors: Record<string, React.ReactNode>;
  pristine: boolean;
  setFormError: (name: string, errorMessage: React.ReactNode) => void;
  setValue: (name: string, value: any, errorMessage?: React.ReactNode) => void;
  setValues: (values: Record<string, any>) => void;
  submitError?: Error;
  submitting: boolean;
  values: Record<string, any>;
}

const Context = React.createContext<SimpleFormContext>(null);

export default function SimpleForm<T extends {}>({
  children,
  defaultValues,
  onSubmit,
  resetOnSuccess,
  ...props
}: SimpleFormProps<T>): React.ReactElement {
  const [values, setValues] = React.useState(defaultValues);
  const [submitError, setSubmitError] = React.useState<Error>(null);
  const [formErrors, setFormErrors] = React.useState<Record<string, React.ReactNode>>({});
  const [pristine, setPristine] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const reset = React.useCallback(() => {
    setValues(defaultValues);
    setPristine(true);
  }, [defaultValues]);

  const doSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
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
    },
    [onSubmit, reset, resetOnSuccess, values],
  );

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
      setValues({
        ...values,
        [name]: value,
      });
      setFormError(name, errorMessage);
    },
    [setFormError, values],
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
