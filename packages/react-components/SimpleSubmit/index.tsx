import { type ComponentPropsWithoutRef, type ReactChild, type ReactElement } from 'react';

import { Button, useSimpleForm } from '../index.js';

interface SimpleSubmitProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
  readonly children?: ReactChild;
}

export function SimpleSubmit({ disabled, ...props }: SimpleSubmitProps): ReactElement {
  const { formErrors, pristine, submitting } = useSimpleForm();

  return (
    <Button
      {...props}
      color="primary"
      data-testid="login"
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
