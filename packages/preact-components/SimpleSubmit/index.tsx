import { type ComponentChildren, type ComponentProps, type VNode } from 'preact';

import { Button } from '../Button/index.js';
import { useSimpleForm } from '../SimpleForm/index.js';

interface SimpleSubmitProps extends Omit<ComponentProps<typeof Button>, 'onChange'> {
  readonly children?: ComponentChildren;

  /**
   * If true, enable the submit button if no values have been changed.
   *
   * @default true
   */
  readonly allowPristine?: boolean;

  readonly dataTestId?: string;
}

export function SimpleSubmit({
  allowPristine = true,
  dataTestId = 'login',
  disabled,
  ...props
}: SimpleSubmitProps): VNode {
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
