import React, { ComponentPropsWithoutRef, ReactElement, useCallback, useRef } from 'react';

import { IconButton, InputField, useMessages } from '..';

interface FormOutputProps
  extends Omit<
    ComponentPropsWithoutRef<typeof InputField>,
    'control' | 'onChange' | 'readOnly' | 'required'
  > {
  /**
   * The message to display if there was a problem copying the content.
   */
  copyErrorMessage: string;

  /**
   * The message to display if the contents have been copied succesfully.
   */
  copySuccessMessage: string;
}

/**
 * Render a read-only input field with a copy button.
 *
 * If the copy button is pressed, the value of the input is copied to the clipboard and the user is
 * notified of this.
 */
export function FormOutput({
  copyErrorMessage,
  copySuccessMessage,
  ...props
}: FormOutputProps): ReactElement {
  const ref = useRef<HTMLInputElement>();
  const push = useMessages();

  const onClick = useCallback(() => {
    const input = ref.current;
    let success = false;
    if (input) {
      input.select();
      success = document.execCommand('copy');
    }
    if (success) {
      push({ body: copySuccessMessage, color: 'success' });
    } else {
      push({ body: copyErrorMessage, color: 'danger' });
    }
  }, [copyErrorMessage, copySuccessMessage, push]);

  return (
    <InputField
      control={<IconButton icon="copy" onClick={onClick} />}
      readOnly
      ref={ref}
      // Hide the (Optional) label.
      required
      {...props}
    />
  );
}
