import { type OpenAPIV3 } from 'openapi-types';

import { paths as loginPaths } from './login.js';
import { paths as registerPaths } from './register.js';
import { paths as requestResetPasswordPaths } from './requestResetPassword.js';
import { paths as resendPaths } from './resend.js';
import { paths as resetPasswordPaths } from './resetPassword.js';
import { paths as verifyPaths } from './verify.js';

export const paths: OpenAPIV3.PathsObject = {
  ...loginPaths,
  ...registerPaths,
  ...requestResetPasswordPaths,
  ...resendPaths,
  ...resetPasswordPaths,
  ...verifyPaths,
};
