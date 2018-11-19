import { ForgotPassword } from '@appsemble/react-components';
import axios from 'axios';
import React from 'react';

async function forgotPassword(email) {
  return axios.post('/api/email/reset/request', { email });
}

export default () => <ForgotPassword request={forgotPassword} />;
