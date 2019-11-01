import React from 'react';

import Input from '../Input';
import { useSimpleForm } from '../SimpleForm';

type ValidityMessages = {
  [_ in keyof Omit<ValidityState, 'valid'>]?: React.ReactNode;
};

interface SimpleInputProps extends Omit<React.ComponentPropsWithoutRef<typeof Input>, 'onChange'> {
  name: string;
  validityMessages?: ValidityMessages;
}

export default function SimpleInput({
  disabled,
  name,
  validityMessages = {},
  ...props
}: SimpleInputProps): React.ReactElement {
  const { formErrors, pristine, setFormError, setValue, submitting, values } = useSimpleForm();
  const ref = React.useRef<HTMLInputElement>(null);
  const onChange = React.useCallback(
    ({ target }: React.ChangeEvent<HTMLInputElement>, value: string = target.value) => {
      const { validity } = target;
      let message: React.ReactNode;
      if (!validity.valid) {
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
      setFormError(name, !ref.current.validity.valid);
    }
  }, [formErrors, name, setFormError]);

  return (
    <Input
      disabled={disabled || submitting}
      error={!pristine && formErrors[name]}
      inputRef={ref}
      name={name}
      onChange={onChange}
      value={values[name]}
      {...props}
    />
  );
}
