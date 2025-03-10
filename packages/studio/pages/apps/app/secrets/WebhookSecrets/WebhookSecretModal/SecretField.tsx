import { IconButton, InputField, useCombinedRefs } from '@appsemble/react-components';
import axios from 'axios';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { messages } from './messages.js';

interface SecretFieldProps {
  readonly appId: number;
  readonly secretId: string;
}

export const SecretField = forwardRef<HTMLInputElement, SecretFieldProps>((props, ref) => {
  const inputRef = useRef<HTMLInputElement>();
  const { appId, secretId } = props;
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState('');
  const { formatMessage } = useIntl();

  useEffect(() => {
    (async () => {
      const { data } = await axios.get(`/api/apps/${appId}/secrets/webhook/${secretId}`);
      setValue(data.secret);
    })();
  }, [appId, secretId]);

  const toggle = useCallback(() => {
    setVisible(!visible);
    inputRef.current?.focus();
  }, [visible]);

  const combinedRef = useCombinedRefs(ref, inputRef);

  return (
    <InputField
      aria-label={visible ? formatMessage(messages.hideSecret) : formatMessage(messages.showSecret)}
      control={<IconButton icon={visible ? 'eye-slash' : 'eye'} onClick={toggle} />}
      icon="unlock"
      onChange={() => null}
      ref={combinedRef}
      type={visible ? 'text' : 'password'}
      value={value}
    />
  );
});
