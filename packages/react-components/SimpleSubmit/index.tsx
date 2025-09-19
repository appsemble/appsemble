import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { Button, useSimpleForm } from '../index.js';

interface SimpleSubmitProps extends Omit<ComponentPropsWithoutRef<'button'>, 'onChange'> {
  readonly children?: ReactNode;

  /**
   * If true, enable the submit button if no values have been changed.
   *
   * @default false
   */
  readonly allowPristine?: boolean;

  readonly dataTestId?: string;
}

export function SimpleSubmit({
  allowPristine = true,
  dataTestId = 'login',
  disabled,
  ...props
}: SimpleSubmitProps): ReactNode {
  const { formErrors, pristine, submitting } = useSimpleForm();

  return (
    <Button
      {...props}
      color="primary"
      data-testid={dataTestId}
      disabled={
        disabled ||
        (!allowPristine && Object.values(pristine).every(Boolean)) ||
        submitting ||
        Object.values(formErrors).some(Boolean)
      }
      loading={submitting}
      type="submit"
    />
  );
}
