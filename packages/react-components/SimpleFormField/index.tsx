import {
  ChangeEvent,
  ComponentPropsWithoutRef,
  ComponentType,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';

import { InputField, useSimpleForm } from '..';

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
  component?: C;
  disabled?: boolean;
  name: string;
  onChange?: (event: ChangeEvent<MinimalHTMLElement>, value: any) => void;
  preprocess?: (newValue: any, oldValues: Record<string, any>) => any;
  validityMessages?: ValidityMessages;
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
  const { formErrors, pristine, setFormError, setValue, submitting, values } = useSimpleForm();
  const ref = useRef<MinimalHTMLElement>(null);
  const internalOnChange = useCallback(
    (event: ChangeEvent<MinimalHTMLElement>, value = event.currentTarget.value) => {
      const val = preprocess ? preprocess(value, values) : value;
      if (onChange) {
        onChange(event, val);
      }
      const validity = event?.currentTarget?.validity;
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
      error={!pristine[name] && formErrors[name]}
      name={name}
      onChange={internalOnChange}
      ref={ref}
      value={values[name]}
      {...props}
    />
  );
}
