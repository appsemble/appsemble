import { ForgotPassword } from '@appsemble/react-components';
import axios from 'axios';
import React from 'react';

async function forgotPassword(email) {
  return axios.post('/api/email/reset/request', { email });
}

async function resetPassword(token, password) {
  return axios.post('/api/email/reset', { token, password });
}

export default () => <ForgotPassword request={forgotPassword} reset={resetPassword} />;
