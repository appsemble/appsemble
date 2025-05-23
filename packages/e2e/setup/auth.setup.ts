import { expect, test as setup } from '../index.js';

const { BOT_ACCOUNT_EMAIL, BOT_ACCOUNT_PASSWORD } = process.env;

setup('authenticate', async ({ loginUser }) => {
  expect(BOT_ACCOUNT_EMAIL && BOT_ACCOUNT_PASSWORD).not.toBeUndefined();

  const accessToken = await loginUser(BOT_ACCOUNT_EMAIL!, BOT_ACCOUNT_PASSWORD!, true);
  expect(accessToken).toStrictEqual(expect.any(String));
  // Playwright uses this environment variable to authenticate API requests
  process.env.ACCESS_TOKEN = accessToken;
});
