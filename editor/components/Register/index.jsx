import { Register } from '@appsemble/react-components';
import axios from 'axios';
import React from 'react';

async function registerEmail(email, password) {
  return axios.post('/api/email', { email, password });
}

export default () => <Register register={registerEmail} />;
