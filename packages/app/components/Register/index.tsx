import {
  Content,
  Register as RegisterForm,
  type RegistrationFormValues,
  useMeta,
  useQuery,
} from '@appsemble/react-components';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { AppBar } from '../TitleBar/index.js';

export function Register(): ReactNode {
  useMeta(messages.register);

  const { passwordLogin } = useAppMember();
  const { lang } = useParams<{ lang: string }>();
  const qs = useQuery();
  const { definition } = useAppDefinition();
  const redirect = qs.get('redirect');

  const onRegister = useCallback(
    async (values: RegistrationFormValues): Promise<void> => {
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);
      // @ts-expect-error 2769 No overload matches this call (strictNullChecks)
      formData.append('locale', lang);
      formData.append('timezone', timezone);

      if (values.name) {
        formData.append('name', values.name);
      }

      if (values.phoneNumber) {
        formData.append('phoneNumber', values.phoneNumber);
      }

      await axios.post(`${apiUrl}/api/apps/${appId}/auth/email/register`, formData);
      await passwordLogin({
        username: values.email,
        password: values.password,
        redirect: redirect ?? undefined,
      });
    },
    [lang, passwordLogin, redirect],
  );

  return (
    <Content padding>
      <AppBar />
      <RegisterForm
        onRegister={onRegister}
        phoneNumberDefinition={definition.members?.phoneNumber}
      />
    </Content>
  );
}
