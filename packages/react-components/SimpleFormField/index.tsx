import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { InputField, useSimpleForm } from '../index.js';

type ValidityMessages = {
  [key in keyof Omit<ValidityState, 'valid'>]?: ReactNode;
};

export interface MinimalHTMLElement {
  value: any;
  validity?: ValidityState;
}

interface InputComponentProps {
  disabled: boolean;
  error: ReactNode;
  name: string;
  onChange: (event: ChangeEvent<MinimalHTMLElement>, value: any) => void;
  value: any;
}

type SimpleFormFieldProps<C extends ComponentType> = Omit<
  ComponentPropsWithoutRef<C>,
  keyof InputComponentProps
> & {
  readonly component?: C;
  readonly disabled?: boolean;
  readonly name: string;
  readonly onChange?: (event: ChangeEvent<MinimalHTMLElement>, value: any) => void;
  readonly preprocess?: (newValue: any, oldValues: Record<string, any>) => any;
  readonly validityMessages?: ValidityMessages;
};

export function SimpleFormField<C extends ComponentType = typeof InputField>({
  component: Component = InputField as ComponentType as C,
  disabled,
  name,
  onChange,
  preprocess,
  validityMessages = {},
  ...props
}: SimpleFormFieldProps<C>): ReactElement {
  const { formErrors, id, pristine, setFormError, setValue, submitting, values } = useSimpleForm();
  const prevNameValueRef = useRef<string>(values.name);
  const ref = useRef<MinimalHTMLElement>(null);

  const validateValue = useCallback(
    (input: MinimalHTMLElement, key: string, value: string) => {
      const validity = input?.validity;
      let message: ReactNode;
      if (validity && !validity.valid) {
        const reason = Object.entries(validityMessages).find(
          ([validityType]: [keyof ValidityMessages, ReactNode]) => validity[validityType],
        );
        message = reason ? reason[1] : true;
      }
      setValue(key, value, message);
    },
    [setValue, validityMessages],
  );

  const internalOnChange = useCallback(
    (event: ChangeEvent<MinimalHTMLElement>, value = event.currentTarget.value) => {
      const val = preprocess ? preprocess(value, values) : value;
      if (onChange) {
        onChange(event, val);
      }

      validateValue(event?.currentTarget, name, val);
    },
    [name, onChange, preprocess, validateValue, values],
  );

  useEffect(() => {
    // Only run for create organization form
    // Only when the name field is changed
    if (id === 'create-organization' && values.name !== prevNameValueRef.current) {
      const idField = document.querySelector<HTMLInputElement>('#id');
      validateValue(idField, idField.name, idField?.value || '');

      prevNameValueRef.current = values.name;
    }
  }, [values, validateValue, id]);

  useEffect(() => {
    if (!(name in formErrors)) {
      const validity = ref?.current?.validity;
      setFormError(name, validity && !validity.valid);
    }
  }, [formErrors, name, setFormError]);

  return (
    // @ts-expect-error XXX This shouldn’t be necessary.
    <Component
      disabled={disabled || submitting}
      error={!pristine[name] && formErrors[name]}
      name={name}
      onChange={internalOnChange}
      ref={ref}
      value={values[name]}
      {...props}
    />
  );
}
