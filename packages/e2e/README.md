# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.34.1-test.2/config/assets/logo.svg) Appsemble End 2 End Tests

> Run end 2 end tests on an Appsemble environment

[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.34.1-test.2/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.34.1-test.2)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Usage](#usage)
- [License](#license)

## Usage

To run end to end tests, run:

```sh
npm run e2e
```

The tests use [Playwright](https://playwright.dev/).

After each test a video will be saved in the `packages/e2e/test-results/{name-test}` directory for
further inspection.

The end to end tests use the following environment variables:

- `BOT_ACCOUNT_EMAIL` — The email address used to login.
- `BOT_ACCOUNT_PASSWORD` — The password used to login.
- `CI_MERGE_REQUEST_IID` — By default tests are run against the staging environment on
  <https://staging.appsemble.review>. If this variable is specified, tests are run against the merge
  request review environment instead.
- `ACCESS_TOKEN` — The access token of the account that's logged in.

### Fixtures

Common end-to-end fixtures are defined under the `fixtures` directory. These are exported for other
packages to use, like client apps. This can be done by installing this package and importing `test`
or `expect`.

### Authentication

Some fixtures call the Appsemble API using the Playwright `request` object. This expects you to have
set an access token as environment variable with the name **ACCESS_TOKEN** beforehand. The easiest
way to do this is by setting it in a setup step using the `loginUser` fixture.

`auth.setup.ts`

```ts
setup('authenticate', async ({ loginUser }) => {
  const accessToken = await loginUser('bot', '12345');
  process.env.ACCESS_TOKEN = accessToken;
});
```

## Contributing

When writing end-to-end tests, have a look at the
[best practices](../../CONTRIBUTING.md#best-practices) to help you write solid tests.

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.34.1-test.2/LICENSE.md) ©
[Appsemble](https://appsemble.com)
