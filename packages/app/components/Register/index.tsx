import {
  Content,
  Register as RegisterForm,
  type RegistrationFormValues,
  useMeta,
} from '@appsemble/react-components';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useUser } from '../UserProvider/index.js';

export function Register(): ReactNode {
  useMeta(messages.register);

  const { passwordLogin } = useUser();
  const { lang } = useParams<{ lang: string }>();

  const onRegister = useCallback(
    async (values: RegistrationFormValues): Promise<void> => {
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);
      formData.append('locale', lang);
      formData.append('timezone', timezone);

      if (values.name) {
        formData.append('name', values.name);
      }

      await axios.post(`${apiUrl}/api/user/apps/${appId}/account`, formData);
      await passwordLogin({ username: values.email, password: values.password });
    },
    [passwordLogin, lang],
  );

  return (
    <Content padding>
      <RegisterForm onRegister={onRegister} />
    </Content>
  );
}
