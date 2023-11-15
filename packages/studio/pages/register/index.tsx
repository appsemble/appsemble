import {
  Content,
  Register,
  type RegistrationFormValues,
  useMeta,
} from '@appsemble/react-components';
import { type TokenResponse } from '@appsemble/types';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';

import { messages } from './messages.js';
import { useUser } from '../../components/UserProvider/index.js';

export function RegisterPage(): ReactNode {
  useMeta(messages.title, messages.description);

  const { login } = useUser();
  const register = useCallback(
    async (values: RegistrationFormValues) => {
      const { data } = await axios.post<TokenResponse>('/api/email', { ...values, timezone });
      login(data);
    },
    [login],
  );

  return (
    <Content>
      <Register onRegister={register} />
    </Content>
  );
}
