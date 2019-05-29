import { AppsembleError, logger } from '@appsemble/node-utils';
import inquirer from 'inquirer';

import { getConfig, requestToken, saveConfig } from '../lib/config';

export const command = 'login';
export const description =
  'Log into Appsemble to retrieve a token for use in authenticated commands.';

export function builder(yargs) {
  return yargs
    .option('email', { desc: 'The email to use for authentication' })
    .option('password', { desc: 'The password to use for authentication' });
}

export async function handler({ remote, ...credentials }) {
  let { email, password } = credentials;

  if (!credentials.email || !credentials.password) {
    const answers = await inquirer.prompt([
      {
        name: 'type',
        message: 'How do you want to log in?',
        choices: ['email'],
        default: 'email',
        type: 'list',
        when: () => !credentials.email && !credentials.password,
      },
      {
        name: 'email',
        message: 'What is your email?',
        when: ans => !credentials.email || ans.type === 'email',
      },
      {
        name: 'password',
        message: 'What is your password?',
        type: 'password',
        when: ans => !credentials.password || ans.type === 'email',
      },
    ]);

    email = email || answers.email;
    password = password || answers.password;
  }

  const requestDate = new Date();

  try {
    const { data: token } = await requestToken(remote, email, password);

    logger.info('Logged in successfully! 🙌');

    const config = await getConfig();
    config[remote] = { auth: { requestDate, token } };
    config.recentRemote = remote;

    await saveConfig(config);
  } catch (e) {
    if (e.response && e.response.status === 401) {
      throw new AppsembleError('Unable to login. The email or password is incorrect. 😓');
    }

    throw e;
  }
}
