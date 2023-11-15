import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { Button, useSimpleForm } from '../index.js';

interface SimpleSubmitProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
  readonly children?: ReactNode;

  /**
   * If true, disable the submit button if no values have been changed.
   *
   * @default true
   */
  readonly allowPristine?: boolean;
}

export function SimpleSubmit({
  allowPristine = true,
  disabled,
  ...props
}: SimpleSubmitProps): ReactNode {
  const { formErrors, pristine, submitting } = useSimpleForm();

  return (
    <Button
      {...props}
      color="primary"
      data-testid="login"
      disabled={
        disabled ||
        (allowPristine && Object.values(pristine).every(Boolean)) ||
        submitting ||
        Object.values(formErrors).some(Boolean)
      }
      loading={submitting}
      type="submit"
    />
  );
}
