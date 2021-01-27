import { ComponentPropsWithoutRef, forwardRef, useCallback, useRef, useState } from 'react';

import { IconButton, InputField, useCombinedRefs } from '..';

type PasswordFieldProps = Omit<
  ComponentPropsWithoutRef<typeof InputField>,
  'control' | 'iconLeft' | 'type'
>;

/**
 * A Bulma styled form input element.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>();
  const [visible, setVisible] = useState(false);

  const toggle = useCallback(() => {
    setVisible(!visible);
    inputRef.current?.focus();
  }, [visible]);

  const combinedRef = useCombinedRefs(ref, inputRef);

  return (
    <InputField
      {...props}
      control={<IconButton icon={visible ? 'eye-slash' : 'eye'} onClick={toggle} />}
      icon="unlock"
      ref={combinedRef}
      type={visible ? 'text' : 'password'}
    />
  );
});
