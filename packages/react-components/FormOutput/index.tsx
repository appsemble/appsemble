import { type ComponentPropsWithoutRef, forwardRef, useCallback, useRef } from 'react';

import { IconButton, InputField, TextAreaField, useCombinedRefs, useMessages } from '../index.js';

interface FormOutputProps
  extends Omit<
    ComponentPropsWithoutRef<typeof InputField>,
    'control' | 'onChange' | 'readOnly' | 'required'
  > {
  /**
   * The message to display if there was a problem copying the content.
   */
  readonly copyErrorMessage: string;

  /**
   * The message to display if the contents have been copied successfully.
   */
  readonly copySuccessMessage: string;

  /**
   * If true, a textarea element will be rendered instead of an input element.
   */
  readonly multiline?: boolean;
}

/**
 * Render a read-only input field with a copy button.
 *
 * If the copy button is pressed, the value of the input is copied to the clipboard and the user is
 * notified of this.
 */
export const FormOutput = forwardRef<HTMLInputElement, FormOutputProps>(
  ({ copyErrorMessage, copySuccessMessage, multiline, ...props }, forwardedRef) => {
    const ref = useRef<HTMLInputElement | HTMLTextAreaElement>();
    const push = useMessages();

    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    const combinedRef = useCombinedRefs(ref, forwardedRef);

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

    if (multiline) {
      return (
        <TextAreaField
          control={<IconButton icon="copy" onClick={onClick} />}
          readOnly
          ref={combinedRef}
          // Hide the (Optional) label.
          required
          {...(props as any)}
        />
      );
    }

    return (
      <InputField
        control={<IconButton icon="copy" onClick={onClick} />}
        readOnly
        ref={combinedRef}
        // Hide the (Optional) label.
        required
        {...(props as ComponentPropsWithoutRef<typeof InputField>)}
      />
    );
  },
);
