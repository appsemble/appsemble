import { ResetPassword } from '@appsemble/react-components';
import axios from 'axios';
import React from 'react';

async function resetPassword(token, password) {
  return axios.post('/api/email/reset', { token, password });
}

export default props => <ResetPassword {...props} reset={resetPassword} />;
