import { ComponentPropsWithoutRef, ReactChild, ReactElement } from 'react';

import { Button, useSimpleForm } from '..';

interface SimpleSubmitProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
  children?: ReactChild;
}

export function SimpleSubmit({ disabled, ...props }: SimpleSubmitProps): ReactElement {
  const { formErrors, pristine, submitting } = useSimpleForm();

  return (
    <Button
      {...props}
      color="primary"
      disabled={
        disabled ||
        Object.values(pristine).every(Boolean) ||
        submitting ||
        Object.values(formErrors).some(Boolean)
      }
      loading={submitting}
      type="submit"
    />
  );
}
