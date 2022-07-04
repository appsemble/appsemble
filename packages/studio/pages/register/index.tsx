import { Content, Register, RegistrationFormValues, useMeta } from '@appsemble/react-components';
import { TokenResponse } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';

import { useUser } from '../../components/UserProvider';
import { messages } from './messages';

export function RegisterPage(): ReactElement {
  useMeta(messages.title, messages.description);

  const { login } = useUser();
  const register = useCallback(
    async (values: RegistrationFormValues) => {
      const { data } = await axios.post<TokenResponse>('/api/email', values);
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
