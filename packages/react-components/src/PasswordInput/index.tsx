import React, { ComponentPropsWithoutRef, forwardRef, useCallback, useRef, useState } from 'react';

import useCombinedRefs from '../hooks/useCombinedRefs';
import IconButton from '../IconButton';
import Input from '../Input';

type PasswordInputProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  'control' | 'iconLeft' | 'type'
>;

/**
 * A Bulma styled form input element.
 */
export default forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
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
      ref={combinedRef}
      control={<IconButton icon={visible ? 'eye-slash' : 'eye'} onClick={toggle} />}
      iconLeft="unlock"
      type={visible ? 'text' : 'password'}
    />
  );
});
