import { type BulmaColor } from '@appsemble/types';
import { type MouseEventHandler, type ReactElement, type ReactNode } from 'react';

import { CardFooterButton, useSimpleForm } from '../index.js';

interface SimpleModalFooterProps {
  /**
   * The label for the cancel button.
   */
  cancelLabel: ReactNode;

  /**
   * The Bulma color for the submit button.
   *
   * @default 'primary'
   */
  color?: BulmaColor;

  /**
   * The function to call when the modal is closed using the close button.
   */
  onClose: MouseEventHandler<HTMLButtonElement>;

  /**
   * The label for the submit button.
   */
  submitLabel: ReactNode;

  /**
   * If true, disable the submit button if no values have been changed.
   *
   * @default true
   */
  allowPristine?: boolean;

  /**
   * Whether the submit button should be disabled.
   */
  disabled?: boolean;
}

/**
 * A footer for a modal when combining it with `<SimpleForm />`.
 */
export function SimpleModalFooter({
  allowPristine = true,
  cancelLabel,
  color = 'primary',
  disabled,
  onClose,
  submitLabel,
}: SimpleModalFooterProps): ReactElement {
  const { formErrors, pristine, submitting } = useSimpleForm();

  return (
    <>
      <CardFooterButton disabled={submitting} onClick={onClose}>
        {cancelLabel}
      </CardFooterButton>
      <CardFooterButton
        color={color}
        disabled={
          disabled ||
          (allowPristine && Object.values(pristine).every(Boolean)) ||
          submitting ||
          Object.values(formErrors).some(Boolean)
        }
        loading={submitting}
        type="submit"
      >
        {submitLabel}
      </CardFooterButton>
    </>
  );
}
