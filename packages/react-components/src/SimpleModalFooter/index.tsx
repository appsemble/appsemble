import type { BulmaColor } from '@appsemble/sdk/src';
import React, { MouseEventHandler, ReactElement, ReactNode } from 'react';

import CardFooterButton from '../CardFooterButton';
import { useSimpleForm } from '../SimpleForm';

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
}

/**
 * A footer for a modal when combining it with `<SimpleForm />`.
 */
export default function SimpleModalFooter({
  cancelLabel,
  color = 'primary',
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
        disabled={pristine || submitting || Object.values(formErrors).some(Boolean)}
        loading={submitting}
        type="submit"
      >
        {submitLabel}
      </CardFooterButton>
    </>
  );
}
