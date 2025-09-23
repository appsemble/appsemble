import { type BulmaColor } from '@appsemble/types';
import { type MouseEventHandler, type ReactNode } from 'react';

import { CardFooterButton, useSimpleForm } from '../index.js';

interface SimpleModalFooterProps {
  /**
   * The label for the cancel button.
   */
  readonly cancelLabel: ReactNode;

  /**
   * The Bulma color for the submit button.
   *
   * @default 'primary'
   */
  readonly color?: BulmaColor;

  /**
   * The function to call when the modal is closed using the close button.
   */
  readonly onClose: MouseEventHandler<HTMLButtonElement>;

  /**
   * The label for the submit button.
   */
  readonly submitLabel: ReactNode;

  /**
   * If true, enable the submit button if no values have been changed.
   *
   * @default false
   */
  readonly allowPristine?: boolean;

  /**
   * Whether the submit button should be disabled.
   */
  readonly disabled?: boolean;
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
}: SimpleModalFooterProps): ReactNode {
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
          (!allowPristine && Object.values(pristine).every(Boolean)) ||
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
