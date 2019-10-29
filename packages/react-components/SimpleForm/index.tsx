import React from 'react';
import { Promisable } from 'type-fest';

import Form from '../Form';

type ChangeEvent = React.ChangeEvent<{ name: string; value?: any }>;

type ChangeHandler = (event: ChangeEvent, value: any) => void;

interface SimpleFormProps<T> extends Omit<React.ComponentProps<typeof Form>, 'onSubmit' | 'ref'> {
  children: React.ReactNode;
  defaultValues: T;
  onSubmit: (values: T) => Promisable<void>;
  resetOnSuccess?: boolean;
}

interface SimpleFormContext {
  onChange: ChangeHandler;
  pristine: boolean;
  setValue: (name: string, value: any) => void;
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
  const [pristine, setPristine] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  function reset(): void {
    setValues(defaultValues);
    setPristine(true);
  }

  async function doSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
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
  }

  function setValue(name: string, value: any): void {
    setPristine(false);
    setValues({
      ...values,
      [name]: value,
    });
  }

  function onChange({ target }: ChangeEvent, value = target.value): void {
    setValue(target.name, value);
  }

  return (
    <Form {...props} onSubmit={doSubmit}>
      <Context.Provider
        value={{
          onChange,
          pristine,
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
