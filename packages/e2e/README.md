# End 2 end tests

> Run end 2 end tests on an Appsemble environment

## Usage

To run end to end tests, run:

```sh
yarn e2e
```

The tests use [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer).

After each test a screenshot will be saved in the `__screenshots__` directory for further
inspection.

The end to end tests use the following environment variables:

- `BOT_ACCOUNT_EMAIL` — The email address used to login.
- `BOT_ACCOUNT_PASSWORD` — The password used to login.
- `CI_MERGE_REQUEST_IID` — By default tests are run against the staging environment on
  https://staging.appsemble.review. If this variable is specified, tests are run against the merge
  request review environment instead.
- `DUMPIO` — If set to `true`, puppeteer IO will be dumped to the terminal.
- `HEADLESS` — By default a headless browser is used. Set this to `false` to disable headless mode,
