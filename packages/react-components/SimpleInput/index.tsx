import React from 'react';

import Input from '../Input';
import { useSimpleForm } from '../SimpleForm';

type ValidityMessages = {
  [_ in keyof Omit<ValidityState, 'valid'>]?: React.ReactNode;
};

interface MinimalHTMLElement {
  value: any;
  validity?: ValidityState;
}

interface ComponentProps {
  disabled: boolean;
  error: React.ReactNode;
  name: string;
  onChange: (event: React.ChangeEvent<MinimalHTMLElement>, value: any) => void;
}

interface SimpleInputProps<C extends React.ComponentType> {
  component?: C;
  disabled?: boolean;
  name: string;
  validityMessages?: ValidityMessages;
}

type FooProps<C extends React.ComponentType> = Omit<
  React.ComponentPropsWithoutRef<C>,
  keyof ComponentProps
> &
  SimpleInputProps<C>;

export default function SimpleInput<C extends React.ComponentType = typeof Input>({
  // @ts-ignore
  component: Component = Input,
  disabled,
  name,
  validityMessages = {},
  ...props
}: FooProps<C>): React.ReactElement {
  const { formErrors, pristine, setFormError, setValue, submitting, values } = useSimpleForm();
  const ref = React.useRef<MinimalHTMLElement>(null);
  const onChange = React.useCallback(
    ({ target }: React.ChangeEvent<MinimalHTMLElement>, value = target.value) => {
      const { validity } = target;
      let message: React.ReactNode;
      if (validity && !validity.valid) {
        const reason = Object.entries(validityMessages).find(
          ([validityType]: [keyof ValidityMessages, React.ReactNode]) => validity[validityType],
        );
        message = reason ? reason[1] : true;
      }
      setValue(name, value, message);
    },
    [name, setValue, validityMessages],
  );

  React.useEffect(() => {
    if (!(name in formErrors)) {
      const { validity } = ref.current;
      setFormError(name, validity && !validity.valid);
    }
  }, [formErrors, name, setFormError]);

  return (
    // @ts-ignore
    <Component
      ref={ref}
      disabled={disabled || submitting}
      error={!pristine && formErrors[name]}
      name={name}
      onChange={onChange}
      value={values[name]}
      {...props}
    />
  );
}
