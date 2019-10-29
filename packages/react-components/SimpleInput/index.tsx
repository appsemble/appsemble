import React from 'react';

import Input from '../Input';
import { useSimpleForm } from '../SimpleForm';

interface SimpleInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange'> {
  name: string;
}

export default function SimpleInput({
  disabled,
  name,
  ...props
}: SimpleInputProps): React.ReactElement {
  const { onChange, submitting, values } = useSimpleForm();

  return (
    <Input
      disabled={disabled || submitting}
      name={name}
      onChange={onChange}
      value={values[name]}
      {...props}
    />
  );
}
