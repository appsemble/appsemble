import {
  Content,
  Register as RegisterForm,
  RegistrationFormValues,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';

import { appId } from '../../utils/settings';
import { useUser } from '../UserProvider';

export function Register(): ReactElement {
  const { passwordLogin } = useUser();

  const onRegister = useCallback(
    async (values: RegistrationFormValues): Promise<void> => {
      await axios.post(`/api/apps/${appId}/member`, values);
      await passwordLogin({ username: values.email, password: values.password });
    },
    [passwordLogin],
  );

  return (
    <Content>
      <RegisterForm onRegister={onRegister} />
    </Content>
  );
}
