import React, { ComponentPropsWithoutRef, ReactChild, ReactElement } from 'react';

import Button from '../Button';
import { useSimpleForm } from '../SimpleForm';

interface SimpleSubmitProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
  children?: ReactChild;
}

export default function SimpleSubmit({
  disabled,
  name,
  ...props
}: SimpleSubmitProps): ReactElement {
  const { formErrors, pristine, submitting } = useSimpleForm();

  return (
    <Button
      {...props}
      color="primary"
      disabled={disabled || pristine || submitting || Object.values(formErrors).some(Boolean)}
      loading={submitting}
      type="submit"
    />
  );
}
