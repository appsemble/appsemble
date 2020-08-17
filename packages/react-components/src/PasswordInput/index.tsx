import React, { ComponentPropsWithoutRef, forwardRef, useCallback, useRef, useState } from 'react';

import { IconButton, Input, useCombinedRefs } from '..';

type PasswordInputProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  'control' | 'iconLeft' | 'type'
>;

/**
 * A Bulma styled form input element.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>();
  const [visible, setVisible] = useState(false);

  const toggle = useCallback(() => {
    setVisible(!visible);
    inputRef.current?.focus();
  }, [visible]);

  const combinedRef = useCombinedRefs(ref, inputRef);

  return (
    <Input
      {...props}
      control={<IconButton icon={visible ? 'eye-slash' : 'eye'} onClick={toggle} />}
      iconLeft="unlock"
      ref={combinedRef}
      type={visible ? 'text' : 'password'}
    />
  );
});
