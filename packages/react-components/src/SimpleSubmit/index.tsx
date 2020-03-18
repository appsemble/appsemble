import * as React from 'react';

import Button from '../Button';
import { useSimpleForm } from '../SimpleForm';

interface SimpleSubmitProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onChange'> {
  children?: React.ReactChild;
}

export default function SimpleSubmit({
  disabled,
  name,
  ...props
}: SimpleSubmitProps): React.ReactElement {
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
