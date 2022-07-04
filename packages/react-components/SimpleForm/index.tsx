import {
  ComponentPropsWithoutRef,
  createContext,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { Form } from '..';

interface SimpleFormProps<T>
  extends Omit<ComponentPropsWithoutRef<typeof Form>, 'onSubmit' | 'ref'> {
  children: ReactNode;
  defaultValues: T;
  onSubmit: (values: T) => void;
  preprocess?: (name: string, newValues: T, oldValues: T) => T;
  resetOnSuccess?: boolean;
}

type FormErrors = Record<string, ReactNode>;

type FormValues = Record<string, any>;

interface SimpleFormContext {
  formErrors: FormErrors;
  pristine: Record<string, boolean>;
  setFormError: (name: string, errorMessage: ReactNode) => void;
  setValue: (name: string, value: any, errorMessage?: ReactNode) => void;
  setValues: (values: FormValues) => void;
  submitError?: Error;
  submitting: boolean;
  values: FormValues;
}

const Context = createContext<SimpleFormContext>(null);
export const SimpleFormProvider = Context.Provider;

export function SimpleForm<T extends {}>({
  children,
  defaultValues,
  onSubmit,
  preprocess,
  resetOnSuccess,
  ...props
}: SimpleFormProps<T>): ReactElement {
  const [values, setValues] = useState(defaultValues);
  const [submitError, setSubmitError] = useState<Error>(null);
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
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      setSubmitError(err as Error);
      return;
    } finally {
      setSubmitting(false);
    }
    setSubmitError(null);
    if (resetOnSuccess) {
      reset();
    }
  }, [onSubmit, reset, resetOnSuccess, values]);

  const setFormError = useCallback((name: string, errorMessage?: ReactNode) => {
    setFormErrors((oldFormErrors) => ({
      ...oldFormErrors,
      [name]: errorMessage,
    }));
  }, []);

  const setValue = useCallback(
    (name: string, value: any, errorMessage?: ReactNode) => {
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
      setValues,
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
