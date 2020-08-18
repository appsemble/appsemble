import React, {
  ChangeEvent,
  ComponentPropsWithoutRef,
  ComponentType,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { Input, useSimpleForm } from '..';

type ValidityMessages = {
  [_ in keyof Omit<ValidityState, 'valid'>]?: ReactNode;
};

interface MinimalHTMLElement {
  value: any;
  validity?: ValidityState;
}

interface InputComponentProps {
  disabled: boolean;
  error: ReactNode;
  name: string;
  onChange: (event: ChangeEvent<MinimalHTMLElement>, value: any) => void;
}

interface SimpleInputProps<C extends ComponentType> {
  component?: C;
  disabled?: boolean;
  name: string;
  onChange?: (event: ChangeEvent<MinimalHTMLElement>, value: any) => void;
  preprocess?: (newValue: any, oldValues: { [field: string]: any }) => any;
  validityMessages?: ValidityMessages;
}

type FooProps<C extends ComponentType> = Omit<
  ComponentPropsWithoutRef<C>,
  keyof InputComponentProps
> &
  SimpleInputProps<C>;

export function SimpleInput<C extends ComponentType = typeof Input>({
  // @ts-expect-error TypeScript disallows assigning a default value that matches a non-default type
  component: Component = Input,
  disabled,
  name,
  onChange,
  preprocess,
  validityMessages = {},
  ...props
}: FooProps<C>): ReactElement {
  const { formErrors, pristine, setFormError, setValue, submitting, values } = useSimpleForm();
  const ref = useRef<MinimalHTMLElement>(null);
  const internalOnChange = useCallback(
    (event: ChangeEvent<MinimalHTMLElement>, value = event.currentTarget.value) => {
      const val = preprocess ? preprocess(value, values) : value;
      if (onChange) {
        onChange(event, val);
      }
      const { validity } = event.currentTarget;
      let message: ReactNode;
      if (validity && !validity.valid) {
        const reason = Object.entries(validityMessages).find(
          ([validityType]: [keyof ValidityMessages, ReactNode]) => validity[validityType],
        );
        message = reason ? reason[1] : true;
      }
      setValue(name, val, message);
    },
    [name, onChange, preprocess, setValue, validityMessages, values],
  );

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
      error={!pristine && formErrors[name]}
      name={name}
      onChange={internalOnChange}
      ref={ref}
      value={values[name]}
      {...props}
    />
  );
}
