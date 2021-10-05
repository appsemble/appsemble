import {
  Content,
  Register as RegisterForm,
  RegistrationFormValues,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';

import { apiUrl, appId } from '../../utils/settings';
import { useUser } from '../UserProvider';

export function Register(): ReactElement {
  const { passwordLogin } = useUser();

  const onRegister = useCallback(
    async (values: RegistrationFormValues): Promise<void> => {
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);
      if (values.name) {
        formData.append('email', values.name);
      }

      await axios.post(`${apiUrl}/api/user/apps/${appId}/account`, formData);
      await passwordLogin({ username: values.email, password: values.password });
    },
    [passwordLogin],
  );

  return (
    <Content padding>
      <RegisterForm onRegister={onRegister} />
    </Content>
  );
}
