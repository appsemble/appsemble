import querystring from 'querystring';

import AppDirectory from 'appdirectory';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import axios from 'axios';
import { logger } from '@appsemble/node-utils';

export const command = 'login';
export const description =
  'Log into Appsemble to retrieve a token for use in authenticated commands.';

export function builder(yargs) {
  return yargs
    .option('email', { desc: 'The email to use for authentication' })
    .option('password', { desc: 'The password to use for authentication' });
}

async function requestToken(remote, username, password) {
  const { status, data } = await axios.post(
    `${remote}/api/oauth/token`,
    querystring.stringify({
      grant_type: 'password',
      username,
      password,
      client_id: 'appsemble-editor',
      scope: 'apps:read apps:write',
    }),
  );

  return { status, data };
}

export async function handler({ remote, ...credentials }) {
  logger.info(remote);
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
  const { status, data: token } = await requestToken(remote, email, password);

  if (status !== 200) {
    logger.info('Unable to login. 😓');
    process.exit();
  }

  logger.info('Logged in successfully! 🙌');

  const configPath = new AppDirectory({
    appName: 'appsemble',
    appAuthor: 'appsemble',
  });

  const filePath = `${configPath.userConfig()}/config.json`;
  await fs.ensureFile(filePath);

  const config = (await fs.readJson(filePath, { throws: false })) || {};
  config[remote] = { auth: { requestDate, token } };
  config.recentRemote = remote;

  await fs.outputJson(filePath, config);

  logger.info('All done! 👋');
}
