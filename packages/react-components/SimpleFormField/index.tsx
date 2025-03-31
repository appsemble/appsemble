import {
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type ComponentType,
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
  readonly name?: string;
  readonly onChange?: (event: ChangeEvent<MinimalHTMLElement>, value: any) => void;
  readonly preprocess?: (newValue: any, oldValues: Record<string, any>) => any;
  readonly validityMessages?: ValidityMessages;
  readonly value?: any;
};

export function SimpleFormField<C extends ComponentType = typeof InputField>({
  component: Component = InputField as ComponentType as C,
  disabled,
  name,
  onChange,
  preprocess,
  validityMessages = {},
  value,
  ...props
}: SimpleFormFieldProps<C>): ReactNode {
  const { formErrors, id, pristine, setFormError, setValue, submitting, values } = useSimpleForm();
  const prevNameValueRef = useRef<string>(values.name);
  const ref = useRef<MinimalHTMLElement>(null);

  const validateValue = useCallback(
    (input: MinimalHTMLElement, key: string, val: string) => {
      const validity = input?.validity;
      let message: ReactNode;
      if (validity && !validity.valid) {
        const reason = Object.entries(validityMessages).find(
          // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
          // @ts-ignore 2769 No overload matches this call (strictNullChecks)
          ([validityType]: [keyof ValidityMessages, ReactNode]) => validity[validityType],
        );
        message = reason ? reason[1] : true;
      }
      setValue(key, val, message);
    },
    [setValue, validityMessages],
  );

  const internalOnChange = useCallback(
    (event: ChangeEvent<MinimalHTMLElement>, currentValue = event.currentTarget.value) => {
      const val = preprocess ? preprocess(currentValue, values) : currentValue;
      if (onChange) {
        onChange(event, val);
      }

      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      validateValue(event?.currentTarget, name, val);
    },
    [name, onChange, preprocess, validateValue, values],
  );

  useEffect(() => {
    // TODO: this is a bad hack. don't do this
    // Only run for create organization form
    // Only when the name field is changed
    if (id === 'create-organization' && values.name !== prevNameValueRef.current) {
      const idField = document.querySelector<HTMLInputElement>('#id');
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      validateValue(idField, idField.name, idField?.value || '');

      prevNameValueRef.current = values.name;
    }
  }, [values, validateValue, id]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 18048 variable is possibly undefined (strictNullChecks)
    if (!(name in formErrors)) {
      const validity = ref?.current?.validity;
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      setFormError(name, validity && !validity.valid);
    }
  }, [formErrors, name, setFormError]);

  return (
    // @ts-expect-error XXX This shouldn’t be necessary.
    <Component
      disabled={disabled || submitting}
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore Messed up - undefined cannot be used as an index type
      error={!pristine[name] && formErrors[name]}
      name={name}
      onChange={internalOnChange}
      ref={ref}
      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore Messed up - undefined cannot be used as an index type
      value={value || values[name]}
      {...props}
    />
  );
}
