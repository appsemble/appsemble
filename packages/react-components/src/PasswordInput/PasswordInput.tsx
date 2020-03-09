import * as React from 'react';

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
  const [visible, setVisible] = React.useState(false);

  const toggle = React.useCallback(() => {
    setVisible(!visible);
  }, [visible]);

  return (
    <Input
      {...props}
      ref={ref}
      control={<IconButton icon={visible ? 'eye-slash' : 'eye'} onClick={toggle} />}
      iconLeft="unlock"
      type={visible ? 'text' : 'password'}
    />
  );
});
