import { Content, Register, RegistrationFormValues, useMeta } from '@appsemble/react-components';
import { TokenResponse } from '@appsemble/types';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';

import { useUser } from '../../components/UserProvider/index.js';
import { messages } from './messages.js';

export function RegisterPage(): ReactElement {
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
