# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.31.1-test.0/config/assets/logo.svg) Appsemble End 2 End Tests

> Run end 2 end tests on an Appsemble environment

[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.31.1-test.0/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.31.1-test.0)
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

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.31.1-test.0/LICENSE.md) ©
[Appsemble](https://appsemble.com)
