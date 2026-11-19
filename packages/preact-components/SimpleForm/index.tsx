import { type ComponentChildren, type ComponentProps, createContext, type VNode } from 'preact';
import { useCallback, useContext, useMemo, useState } from 'preact/hooks';

import { Form } from '../Form/index.js';

interface SimpleFormProps<T> extends Omit<ComponentProps<typeof Form>, 'onSubmit' | 'ref'> {
  readonly children: ComponentChildren;
  readonly defaultValues: T;
  readonly onSubmit: (values: T) => void;
  readonly preprocess?: (name: string, newValues: T, oldValues: T) => T;
  readonly resetOnSuccess?: boolean;
}

type FormErrors = Record<string, ComponentChildren>;

type FormValues = Record<string, any>;

interface SimpleFormContext {
  formErrors: FormErrors;
  pristine: Record<string, boolean>;
  setFormError: (name: string, errorMessage: ComponentChildren) => void;
  setValue: (name: string, value: any, errorMessage?: ComponentChildren) => void;
  setValues: (values: FormValues) => void;
  submitError?: Error;
  submitting: boolean;
  values: FormValues;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore 2322 null is not assignable to type (strictNullChecks)
const Context = createContext<SimpleFormContext>(null);
export const SimpleFormProvider = Context.Provider;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function SimpleForm<T extends {}>({
  children,
  defaultValues,
  onSubmit,
  preprocess,
  resetOnSuccess,
  ...props
}: SimpleFormProps<T>): VNode {
  const [values, setValues] = useState(defaultValues);
  const [submitError, setSubmitError] = useState<Error | undefined>();
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [pristine, setPristine] = useState(
    Object.fromEntries(Object.keys(defaultValues).map((key) => [key, true])),
  );
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setValues(defaultValues);
    setPristine(Object.fromEntries(Object.keys(defaultValues).map((key) => [key, true])));
  }, [defaultValues]);

  const doSubmit = useCallback(async () => {
    setSubmitError(undefined);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      setSubmitError(err as Error);
      return;
    } finally {
      setSubmitting(false);
    }
    setSubmitError(undefined);
    if (resetOnSuccess) {
      reset();
    }
  }, [onSubmit, reset, resetOnSuccess, values]);

  const setFormError = useCallback((name: string, errorMessage?: ComponentChildren) => {
    setFormErrors((oldFormErrors) => ({
      ...oldFormErrors,
      [name]: errorMessage,
    }));
  }, []);

  const setValue = useCallback(
    (name: string, value: any, errorMessage?: ComponentChildren) => {
      setPristine((p) => ({ ...p, [name]: false }));
      setValues((oldValues) => {
        const newValues = {
          ...oldValues,
          [name]: value,
        };
        return preprocess ? preprocess(name, newValues, oldValues) : newValues;
      });
      setFormError(name, errorMessage);
    },
    [preprocess, setFormError],
  );

  const value = useMemo(
    () => ({
      formErrors,
      pristine,
      setFormError,
      setValue,
      setValues: setValues as (values: FormValues) => void,
      submitError,
      submitting,
      values,
    }),
    [formErrors, pristine, setFormError, setValue, submitError, submitting, values],
  );

  return (
    <Form {...props} onSubmit={doSubmit}>
      <Context.Provider value={value}>{children}</Context.Provider>
    </Form>
  );
}

export function useSimpleForm(): SimpleFormContext {
  return useContext(Context);
}
