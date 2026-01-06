# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.36.2-test.0/config/assets/logo.svg) Appsemble End 2 End Tests

> Run end 2 end tests on an Appsemble environment and provide Appsemble fixtures

[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.36.2-test.0/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.36.2-test.0)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [How to install](#how-to-install)
- [Usage](#usage)
- [Appsemble end-to-end tests](#appsemble-end-to-end-tests)
- [Authentication](#authentication)
- [Contribution](#contributing)
- [License](#license)

## How to install

You can install the package by running the following at the root of your project:

```sh
npm install @appsemble/e2e
```

## Usage

To use the fixtures in your tests, you can import `expect` or `test` at the top of the file.

These fixtures can be added to any test by specifying them in the test declaration. Matchers don't
need to be manually added.

```ts
import { expect, test } from '@appsemble/e2e';

test('should navigate to app', async ({ visitApp }) => {
  await visitApp('Example app');
  await expect(page.getByText('Example app')).toBeVisible();
});
```

## Development

This package depends on other packages in the Appsemble monorepo. To make sure all tests run
normally, go to each Appsemble dependency and run the following command:

```sh
npm run prepack
```

## Appsemble end-to-end tests

To run end to end tests, run:

```sh
npm run e2e
```

The tests use [Playwright](https://playwright.dev/).

After each test a video will be saved in the `packages/e2e/test-results/{name-test}` directory for
further inspection.

On the first retry of a failed job, its trace will be uploaded to the same directory. This trace can
be viewed locally, or it can be uploaded to the
[online trace viewer](https://trace.playwright.dev/). This shows you step-by-step what happened
during the test as if you ran it using `ui mode`.

The end to end tests use the following environment variables:

- `CI` — Whether the tests are run in CI.
- `CI_MERGE_REQUEST_IID` — The id of the merge request if it's present.
- `APPSEMBLE_REVIEW_DOMAIN` — The review appsemble domain to use.
- `APPSEMBLE_STAGING_DOMAIN` — The staging appsemble domain to use.

Check the `baseURL` setting in the `playwright.config.ts` file to see how the environment variables
are used.

## Authentication

Some fixtures call the Appsemble API using the Playwright `request` object. This expects the worker
to have logged in and set the access token in the `request` fixture beforehand. This can look like
so:

```ts
export const test = base.extend<object>({
  async request({}, use) {
    const newRequest = await request.newContext({
      extraHTTPHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    await use(newRequest);
    await newRequest.dispose();
  },
});
```

## Contributing

When writing end-to-end tests, have a look at the
[best practices](../../CONTRIBUTING.md#best-practices) to help you write solid tests.

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.36.2-test.0/LICENSE.md) ©
[Appsemble](https://appsemble.com)
