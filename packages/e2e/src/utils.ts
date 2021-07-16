const {
  BOT_ACCOUNT_EMAIL = 'user@example.com',
  BOT_ACCOUNT_PASSWORD = 'test',
  CI_MERGE_REQUEST_IID,
} = process.env;

const baseUrl = `https://${CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`;

/**
 * Create a full URL from a given partial URL.
 *
 * @param url - The URL to create a full URL from.
 * @returns The full URL.
 */
export function createURL(url: string): string {
  return String(new URL(url, baseUrl));
}

/**
 * Open a page using a 1920x1080 viewport and wait for the network to be idle.
 *
 * The Appsemble Studio tag version is set to `0.0.0` to prevent issues when comparing screenshots.
 *
 * @param url - The URL to visit.
 */
export async function open(url: string): Promise<void> {
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto(createURL(url), { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const tag = document.querySelector(
      'a.tag[href^="https://gitlab.com/appsemble/appsemble/-/releases"]',
    );
    tag.textContent = '0.0.0';
  });
  await page.waitForFunction(
    () => document.getElementsByClassName('.appsemble-loader').length === 0,
  );
}

/**
 * Perform a login in Appsemble Studio using a user flow.
 *
 * @param url - The URL to navigate to after logging in.
 */
export async function login(url: string): Promise<void> {
  await open(createURL(`/en/login?${new URLSearchParams({ redirect: url })}`));
  await expect(page).toFillForm('form', {
    email: BOT_ACCOUNT_EMAIL,
    password: BOT_ACCOUNT_PASSWORD,
  });
  await expect(page).toClick('button[type="submit"]', { text: 'Login' });
  await page.waitForFunction(
    () => document.getElementsByClassName('.appsemble-loader').length === 0,
  );
  await page.waitForFunction((pathname: string) => window.location.pathname === pathname, {}, url);
}

/**
 * Sleep asynchronously for an amount of time.
 *
 * This function shouldn’t be used, but it is useful when troubleshooting end to end tests.
 *
 * @param seconds - How long to sleep in seconds.
 */
export async function sleep(seconds = 10): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`Sleeping for ${seconds} seconds`);
  await new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}
