import { type ComponentPropsWithoutRef, forwardRef, useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { messages } from './messages.js';
import { IconButton, InputField, useCombinedRefs } from '../index.js';

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
  const { formatMessage } = useIntl();

  const toggle = useCallback(() => {
    setVisible(!visible);
    inputRef.current?.focus();
  }, [visible]);

  // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
  // @ts-ignore 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const combinedRef = useCombinedRefs(ref, inputRef);

  return (
    <InputField
      {...props}
      aria-label={
        visible ? formatMessage(messages.hidePassword) : formatMessage(messages.showPassword)
      }
      control={<IconButton icon={visible ? 'eye-slash' : 'eye'} onClick={toggle} />}
      icon="unlock"
      ref={combinedRef}
      type={visible ? 'text' : 'password'}
    />
  );
});
