import * as React from 'react';

import useCombinedRefs from '../hooks/useCombinedRefs';
import IconButton from '../IconButton';
import Input from '../Input';

type PasswordInputProps = Omit<
  React.ComponentPropsWithoutRef<typeof Input>,
  'control' | 'iconLeft' | 'type'
>;

/**
 * A Bulma styled form input element.
 */
export default React.forwardRef<HTMLInputElement, PasswordInputProps>((props, ref) => {
  const inputRef = React.useRef<HTMLInputElement>();
  const [visible, setVisible] = React.useState(false);

  const toggle = React.useCallback(() => {
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
