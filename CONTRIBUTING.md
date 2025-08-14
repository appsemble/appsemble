# ![](config/assets/logo.svg) Contributing

## Translating

Our translations are community driven by
[![](https://hosted.weblate.org/static/logo-16.png) Weblate](https://weblate.org). The Appsemble
project on Weblate can be found [here](https://hosted.weblate.org/engage/appsemble)

[![Translation status](https://hosted.weblate.org/widgets/appsemble/-/appsemble/multi-auto.svg 'Translation status')](https://hosted.weblate.org/engage/appsemble/)

New languages can be added [here](https://hosted.weblate.org/projects/appsemble/appsemble/).

## Development

### Apps

When building apps you can also use GitLab to maintain your app, and use CI/CD pipelines for
validation and deployment.

To get started head over to our [Template](https://gitlab.com/appsemble/apps/template) repository
for further instructions.

### Blocks

Everyone can create their own blocks, with any technology. Stricter requirements are enforced on
core blocks. These are the 3 classes of blocks:

| block class | requirements                            | SLA covered | Location                                                  |
| ----------- | --------------------------------------- | ----------- | --------------------------------------------------------- |
| core        | mandatory: plain JS / Preact / mini-jsx | yes         | https://gitlab.com/appsemble/appsemble/-/tree/main/blocks |
| custom      | suggested: plain js / Preact / mini-jsx | optionally  | https://gitlab.com/appsemble/apps                         |
| community   | suggested: plain js / Preact / mini-jsx | no          | varies                                                    |

### Core

#### API

Please follow the guidelines and best practices for naming API endpoints described
[here](https://restfulapi.net/resource-naming/)

### Style guide

The entire code base is formatted using
[![](https://avatars.githubusercontent.com/u/25822731?s=16) Prettier](https://prettier.io).

Please install the
[![](https://avatars.githubusercontent.com/u/1165674?s=16&v=4) EditorConfig](https://editorconfig.org)
extension for your editor of choice if it doesn’t support so out of the box.

This is to ensure stricter whitespace related rules from the
[.editorconfig](https://gitlab.com/appsemble/appsemble/-/blob/main/.editorconfig) file which aren’t
covered by CI.

#### JavaScript / TypeScript

JavaScript and TypeScript code are linted using
[![](https://avatars.githubusercontent.com/u/6019716?s=16) ESLint](https://eslint.org).

#### CSS

CSS styles are linted using
[![](https://avatars.githubusercontent.com/u/10076935?s=16) Stylelint](https://stylelint.io).

#### Markdown

Markdown documents are linted using
[![](https://avatars.githubusercontent.com/u/16309564?s=16) Remark lint](https://github.com/remarkjs/remark-lint)

##### Spelling

Documentation is also spell checked. In case you need to teach the checker new terms, add them to
`config/retext/personal.dic`

#### Documentation validation

We intend to validate all full and partial app YAML examples in the Appsemble documentation using CI
tests, except for very specific cases where the example contains an error on purpose or could not be
validated due to being dependent on the user’s environment.

To validate a code block, which is a full app-definition, append the `validate` tag to its meta. To
validate a code block, which is a part of an app definition, append the `validate` tag and one of
the following available tags to its meta:

- `resources-snippet`
- `page-snippet`
- `pages-snippet`
- `block-snippet`
- `blocks-snippet`
- `cron-snippet`
- `security-snippet`

You can refer to existing code snippets in the guide section of the documentation.

#### Message validation

To add new messages, follow the following format:

```
myMessage: {
  id: '',
  defaultMessage: 'Your message here',
}
```

To generate an ID for the message run:

```sh
npx eslint -- --fix path/to/my-messages-file
```

This will generate an ID using the [formatjs](https://formatjs.io/docs/tooling/linter/) plugin for
`eslint`. A message ID is a base64 encoded hash of the `defaultMessage` and prefixed with the
package name. This is to avoid duplicate messages, i.e., two different messages with similar
`defaultMessage` value will have the same ID and the prefix helps determine where it came from.

The pipeline will automatically detect if newly added messages are missing in the i18n directory. To
automatically extract these messages from the source files run:

```sh
npm run scripts -- extract-messages
```

#### Migration validation

Database models (Sequelize) and migration scripts are compared using
`./packages/server/commands/checkMigrations.ts` to ensure that migrations are not missing or
incorrect. This is done automatically in the CI pipeline. To run it locally, run the following
command:

```sh
npm run appsemble -- check-migrations
```

The command will exit with a non-zero exit code if there are any issues. If there are issues, check
your models and migrations and make sure they are correct.

Similar to the `check-migrations` command there's also the `check-down-migrations` command stored in
`./packages/server/commands/checkDownMigrations.ts`, which ensures the down migration matches with
the previous up migration. The command compares every down migration in chronological order. To run
it locally, run the following command:

```sh
npm run appsemble -- check-down-migrations
```

The command will exit with a non-zero exit code per down migration mismatch. If there are issues,
check the down migration that's highlighted in green, and compare it with any migrations before or
equal to the up migration in red.

> **Note**: These commands require a local test database to be running, for example via
> docker-compose. See [the README](./README.md#getting-started) for more information.

> If there is ever the need to start using the postgres
> [`CHECK-`](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS)
> or
> [`EXCLUSION`](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)
> constraints these commands will not properly catch inconsistencies, because
> [`table checks`](https://kristiandupont.github.io/extract-pg-schema/api/extract-pg-schema.tablecheck.html)
> are not converted from an array to an object to avoid ordering collisions. EXCLUSION constraints
> have not been tested before.

### Permissions

After adding a new permission to the `OrganizationPermission` enum in
`packages/types/permissions.ts` add the permission and it’s description to
`packages/studio/pages/organizations/messages.ts`.

After adding a new permission to the `AppPermission` enum in
`./packages/lang-sdk/types/permission.ts`, add a corresponding one to the `OrganizationPermission`
enum and map them in the `appOrganizationPermissionMapping` object at
`packages/types/permissions.ts`. Then add the permissions to the relevant roles at
`packages/lang-sdk/types/roles.ts` and `packages/types/roles.ts`.

### Testing

Appsemble uses
[![](https://avatars.githubusercontent.com/u/95747107?s=16&v=4) vitest](https://vitest.dev/) for
unit testing. Test files are placed in the same location as the file that’s under test, except that
the test file has a _.test_ suffix. Not everything is tested yet. However, please make sure existing
tests keep working. To run tests, simply run the command below. Any Vitest arguments are supported.

```sh
npm test
```

To run tests for a single file, run

```sh
npm test -- path/to/file
```

Appsemble uses test snapshots to assert large serializable objects like block manifests, HTTP
responses and some react-components. These need
[manual updating](https://jestjs.io/docs/snapshot-testing#are-snapshots-written-automatically-on-continuous-integration-ci-systems)
(we use vitest, but this is essentially the same) which can simply be done by running the commands
mentioned with the `-u` argument. Or when in watch mode by pressing the
[u key](https://vitest.dev/guide/snapshot.html#updating-snapshots) in the terminal.

```sh
npm test -- -u
```

> **Important!**
>
> When writing tests, make sure to put any hooks like `beforeAll` and `afterEach` within a describe
> block to make sure the global hooks are respected.

#### Component Tests

These tests are intended to test preact/react components in isolation and focus mainly on visuals.
They are mainly written for the `@appsemble/preact-components` and `@appsemble/react-components`
packages.

We use `@testing-library/preact` and `@testing-library/react` with `vitest`.

To see an example of how to write these tests, check an existing test in the repo (e.g. in
`packages/preact-components/Button/index.test.tsx`) and/or read the documentation of the testing
libraries.

#### Block Component Tests

These tests are intended to test different components of blocks. For example, the `Header` and
`Footer` components in `@appsemble/list`. They focus mainly on visuals and some user events like
clicking and ensure that block components remain working on small level.

We use `@testing-library/preact` and `@testing-library/react` with `vitest`.

To render a component of a visual block (e.g. `@appsemble/list`, `@appsemble/form`), you need to
wrap it with a `<Context.Provider>` component imported from `@appsemble/preact` and pass it an
object implementing the `BlockProps` interface from `@appsemble/preact`.

To see an example of how to write these tests, check an existing test in the repo (e.g. in
`blocks/list/src/components/ListItem/Header/index.test.tsx`) and/or read the documentation of the
testing libraries.

#### Block Interaction Tests

These tests are intended to test interactions between blocks and make sure that blocks keep working
as intended in combinations with each other. For simplicity, we only maintain interaction tests
between the latest versions of the blocks.

We use `@testing-library/preact` and `@testing-library/react` with `vitest`.

We have a dedicated `@appsemble/block-interaction-tests` package where these tests reside. Each
block interaction has a dedicated directory containing the `index.test.tsx/ts` file and a `types.ts`
file. In `types.ts` the `block.ts` file of each tested block is imported to combine the augmented
interfaces of `@appsemble/sdk`.

To render a visual block (e.g. `@appsemble/list`, `@appsemble/form`), you need to wrap it with a
`<Context.Provider>` component imported from `@appsemble/preact` and pass it an object implementing
the `BlockProps` interface from `@appsemble/preact`.

To render a non-visual block (e.g. `@appsemble/data-loader`, `@paginator/paginator`), you need to
call its bootstrap function with an object implementing the `BootstrapParams` interface from
`@appsemble/sdk`.

If you are testing events, you can create an instance of `EventEmitter` in your test, then call the
`createEvents` function from `@appsemble/block-interaction-tests/utils`.

To see an example of how to write these tests, check an existing test in the repo (e.g. in
`packages/block-interaction-tests/src/list-with-data-loader/index.test.ts`) and/or read the
documentation of the testing libraries.

#### End 2 End Tests

These tests are intended to test the functionality of an app like a user would use it. This includes
network requests, block interactions, data, notifications, files, etc. They assume a pinned version
of each block used in the app, defined in the app-definition, and may need to be updated whenever
these versions change.

The end 2 end tests are run using
[![](https://avatars.githubusercontent.com/u/89237858?s=16) Playwright](https://playwright.dev).
They reside in [`packages/e2e`](packages/e2e).

End 2 end tests can be run locally by installing playwright with:

```shell
npx playwright install
```

preparing the packages so they can be used by our e2e tests with:

```shell
npm --workspace @appsemble/types run prepack
npm --workspace @appsemble/utils run prepack
```

and running:

```shell
npm --workspace @appsemble/e2e run e2e
```

> **Note**
>
> You need to set up your local environment by
>
> - running appsemble locally
> - creating an account
> - creating the appsemble organization
> - publishing blocks
> - publishing apps
>
> You can check how this is done in the docs or by referencing the e2e job in the .gitlab-ci.yaml
> file

> **Note**
>
> You need to export the `BOT_ACCOUNT_EMAIL` and `BOT_ACCOUNT_PASSWORD` environment variables in the
> terminal where you are running the tests from, matching an existing account in your local
> environment

After that you can delete the files generated from prepack with:

```shell
rm -f packages/types/**/*.{d.ts,js,js.map}
rm -f packages/utils/**/*.{d.ts,js,js.map}
```

> **Note**
>
> Be careful not to delete more things than needed like vitest.config.js files

##### Implementation details

The end-to-end tests have more specific implementation details that aren't worth mentioning here.
These can be found in the [README](/packages/e2e/README.md).

##### Best practices

Building end 2 end tests that are stable and pass consistently is not easy. Some best practices are
collected here that may help you build your end 2 end tests:

- Appsemble has it's own [e2e package](/packages/e2e/README.md) that exports fixtures which cover
  Appsemble functionality. These can be imported for use in your own app's e2e tests.
  - If you're missing a fixture that covers Appsemble functionality, feel free to add them to the
    main e2e package instead of your own project. This can then be used by other projects, and will
    be supported through changes of the Appsemble core.
- If you're waiting for data to load but end up with empty lists, it might be because a block has a
  bug that only manifests if the user clicks inhumanely fast, like in the end 2 end tests.
- If you need to pass on secrets into a service container as part of an e2e test in CI, it's
  [not going to work](https://docs.gitlab.com/ci/variables/#in-service-containers). So far, we only
  run these tests locally.
- When waiting for data, wait for the actual resource to have loaded fully from the network.
- Use
  [user-facing locators instead of raw locators](https://playwright.dev/docs/best-practices#prefer-user-facing-attributes-to-xpath-or-css-selectors)
  to improve readability and robustness
- [Locators](https://playwright.dev/docs/locators) auto wait and retry before running, so it's
  rarely necessary to add a `waitFor`
- Use `request` over `fetch` or `axios`. `request` is fully logged in the trace viewer and
  automatically includes things like the `baseURL`.
- In the artifacts of the e2e CI job you can find the trace of an individual test in the 1st retry.
  You can run this trace locally or upload it in https://trace.playwright.dev/ to see exactly what
  happened in the CI job. Great for figuring out why something works locally but not in CI.
- Don't use conditions in your test and try not to have them in your functions/fixtures either.
  These make it difficult to track what the flow of the test should be. Instead it's usually better
  to just make a new test / fixture.
- Keep tests small to make them easier to understand and work with. Split functionality into a
  fixture when possible.
- If your test is big, you can use [test.step](https://playwright.dev/docs/api/class-test#test-step)
  to mark each step of the test, making it easier to see why it failed
- Logging on the respective page and/or actions helps a lot with debugging if you're working on e2e
  tests locally. You can view the page's console logs using: `page.on('console', console.log)`.
  - This can be filtered further by removing warnings or errors by checking the message type:
    ```js
    page.on('console', (message) => {
      if (message.type() === 'log') {
        console.log('custom prefix', message);
      }
    });
    ```
- When testing a specific app you might need to test the flows of different app members with
  different roles. We generally have 3 ways of approaching this:

  1. **(CI only)** Seed app member accounts with roles before running the test (see
     [Restaurants](https://gitlab.com/appsemble/apps/restaurants/-/blob/main/.gitlab-ci.yml?ref_type=heads#L155))
  2. Publish the app in **demo** mode so you can freely create new app members and change their
     roles in the tests themselves
  3. Log into the app with a studio user account and use the `changeAppMemberRole` fixture from the
     `@appsemble/e2e` package to change the app member's role

  These methods all have their own advantages and disadvantages. When facing this issue, it's good
  to determine yourself which of these works best for your project.

- If you are intercepting a request, make sure the target URL is specific enough so it won't get
  intercepted in a place you didn't intend.
- If you are intercepting a request, make sure you do it before the request action is called during
  the test. Otherwise it won't be caught.
- Utilize [global setup projects](https://playwright.dev/docs/test-global-setup-teardown) to run
  setup steps before the tests run.
  - These steps are included in the HTML report and trace viewer and allow you to use fixtures
  - You can use this to log in once and store the authenticated state. When
    [set up properly](https://gitlab.com/appsemble/appsemble/-/blob/main/packages/e2e/setup/auth.setup.ts?ref_type=heads)
    each test will then start already logged in, skipping the login step.
- Make sure your tests are as isolated as possible. This improves reproducibility, makes debugging
  easier and prevents cascading failures. If you're working on an app's e2e tests, this can be done
  by:
  - Deleting created resources/assets/app members/groups at the end of a test
  - **(Not possible with multiple workers)** Reseeding the app in a `beforeEach` hook
  - In the case of using multiple workers, it's best to create an app for each runner as it's easier
    to keep tests isolated
- Finally, Playwright has a list of best practices that are really useful:
  https://playwright.dev/docs/best-practices

#### Testing Guidelines

We aim to follow these guidelines to ensure stability in the platform:

- Aim to test blocks and their components at the lowest possible level first in the following order:
> component tests -> block component tests -> block interaction tests -> e2e tests
- When making changes to a block, make sure its component and interaction tests remain working
- When making changes to a block, make sure to add tests to cover the changes
- e2e tests should be reserved for app specific features

### Local CI

When changes are pushed to a merge request branch, Appsemble runs a CI pipeline in GitLab. The first
stage in the pipeline checks code formatting and styling, and runs tests. You can run that stage
locally to avoid waiting for the pipeline by running the following:

```bash
. scripts/local-pipeline.sh
```

On `arm64/v8` systems, tests that use the `sharp` module will fail. If that happens, you can still
try to push your changes.

### Changelog

Every block and package has a `changed` directory. This directory contains the following folders:

- `added`
- `changed`
- `deprecated`
- `removed`
- `fixed`
- `security`

A single line changelog entry should be placed as markdown file in one of these folders for any
significant change. A single imperative sentence is preferred. Changelog entries are parsed from
these files and added to the [changelog](CHANGELOG.md) on a release. For example a changelog entry
from a file `blocks/filter/changed/added/fullscreen.md` with the content `Add boolean field support`
is parsed into Block(`filter`): Add boolean field support in the `Added` section of the changelog
file. Similarly, a changelog entry from file `packages/cli/changed/export_command.md` with the
content `Add app export command to export an app as a zip file` is parsed into
`Cli: Add app export command to export an app as a zip file.`. Files added by you are removed after
being parsed by the system at the time of release. Folders containing the changelog files are left
with the single `.gitkeep` file.

The format is based on the [keep a changelog] format.

### DNS Mapping

Appsemble relies on multiple domain names mapping to an instance. Typically, this is not supported
on local development machines by default. It is recommended to use [Dnsmasq] to map all URLs ending
on `.localhost` to `127.0.0.1` as suggested by [RFC 2606].

#### Network Manager

Many Linux systems come with Network Manager and `dnsmasq-base` preinstalled. For these systems,
simply add a new file `/etc/NetworkManager/dnsmasq.d/localhost.conf` with the following content:

```ini
address=/.localhost/127.0.0.1
```

After saving the file, this should go in effect immediately. Try running Appsemble and navigating to
<http://foo.bar.localhost:9999>. If this serves something, it works.

#### MacOS

For setting up `Dnsmasq` on MacOS, follow
[this guide](https://medium.com/@kharysharpe/caf767157e43).

#### Hosts file

For platforms that don’t support Dnsmasq, or if you don’t want to use Dnsmasq, the hosts file can be
modified. For example, if you wish to test an app on `foo.appsemble.localhost`, add the following
line to the hosts file:

```
127.0.0.1	foo.appsemble.localhost
```

The hosts file can be found in the following location:

- **Windows**: `C:\Windows\System32\drivers\etc\hosts`
- **MacOS**: `/private/etc/hosts`
- Most systems: `/etc/hosts`

### Migrations

Writing Appsemble migrations must be done with great care, to avoid database corruption in
production and for self-hosted Appsemble instances.

The migrations under `packages/server/migrations` are the source of truth. We do however use
`Meta.sync()` in [migrate.ts](packages/server/utils/migrate.ts) to create the `Meta` table, which
tracks the migration version.

#### Rules

1. Migrations MUST have tested `up` and `down` migrations. You must be able to rollback (to version
   0.24.12) and migrate to the latest without failure, use the following command
   `npm run appsemble fuzz-migrations` for that.

2. Migrations MUST NOT\* contain any conditions, especially ones depending on database values or
   external factors. _The only time this is allowed is when there is no other way around it, and at
   least 3 other core-developers
   ([Appsemble maintainers on GitLab](https://gitlab.com/groups/appsemble/-/group_members?sort=access_level_desc))
   that work during that week agree with the change._

3. You MUST log a warning when expecting potential failures across any Appsemble instance. The
   warning must explain the expected problem(s), and what actions to take to manually clean the
   database appropriately for the migration to succeed.

4. Adding unique rules to columns in a table MUST be done using indexes, NOT constraints. Appsemble
   has a custom eslint rule defined in
   [enforce-index-decorator.cjs](packages/eslint-plugin-appsemble/enforce-index-decorator.cjs) to
   remind you of the correct decorator to use in the models. See why this is done here
   [appsemble-eslint-plugin](packages/appsemble-eslint-plugin/README.md). This also means you MUST
   never use `queryInterface.createConstraint` for unique columns, but instead use
   `queryInterface.createIndex`.

5. Adding unique indexes (or primary keys) should only be done on new tables.

6. Carefully consider whether a column should be nullable to avoid having to clean the database when
   changing the column to non-nullable without a default value.

7. All queries must be part of the transaction, by passing `{ transaction }` as option.

> Note: since all migrations are wrapped in transactions, this does NOT mean it's okay to ignore
> these rules, because others may self-host Appsemble. When a migration fails the following is
> logged:
>
> ```
> [warn]: Upgrade to 0.29.0 unsuccessful, not committing. Current database version 0.28.0.
> [warn]: In case this occured on a hosted Appsemble instance,
> [warn]: and the logs above do not explain how to resolve the below error manually,
> [warn]: consider contacting `support@appsemble.com` to report the migration issue,
> [warn]: and include the stacktrace.
> ```

Migrating up to the latest, or use `--migrate-to` to migrate to a specific version.

```sh
npm run appsemble migrate
```

Migrating down to the first migration.

```sh
npm run appsemble migrate -- --migrate-to 0.24.12
```

## Trainings

When the server starts up it checks the `trainings` directory and makes sure all training IDs are
stored on the database. To make sure this works as intended, the directory should maintain the
following strucutre:

Each folder in the root of the `trainings` directory defines a training chapter. A chapter has a
`properties.json` file that has some additional information on how the chapter should be rendered in
the studio. These properties are:

- `blockedBy`: The ID of the chapter that must be completed before being able to see this one.
- `title`: The chapter's title
- `trainingOrder`: Array of IDs of this chapter's trainings. Defines in what order they appear.

An individual training is placed in a chapter as a directory with a unique ID, and a markdown file
that contains the content called `index.md`.

![Training structure](/config/assets/training-structure.png 'Training structure')

### Adding a new training

1. Find or create the chapter you want to add a training to.
2. Create a new directory with a unique ID representing the name of the training
3. Inside this directory, create a new markdown file: `index.md`.
4. Put the content of the training you want to make in this new markdown file
5. (Optional) Put the place you want this training to be in the `trainingOrder` array of the
   chapter's `properties.json` file. Otherwise, the position in the directory will be used.

### Adding a new chapter

1. Create a new folder in the root of the `trainings` directory with a unique name.
2. In the new folder, create a `properties.json` file containing the following JSON:
   ```json
   {
     "blockedBy": null,
     "title": "Example chapter",
     "trainingOrder": []
   }
   ```
3. Create at least one training in the chapter for it to be considered valid.

#### Define node positions

Define where the chapter gets placed and how they're connected to the other chapters in
[nodePositions.ts](./packages/studio/components/TrainingTree/nodePositions.ts).

1. Set the X and Y positions that define where the chapter gets placed in the training tree
   ```ts
   export const chapterNodes = [
     // ...
     { id: 'new-chapter', position: { x: 100, y: 200 } },
   ];
   ```
2. Set the connections between chapters that are blocking/getting blocked
   ```ts
   export const chapterEdges = [
     // ...
     { from: 'blocking-chapter', to: 'blocked-chapter' },
   ];
   ```

## Releasing

Push to the `staging` branch before pushing to main and releasing to test and review the changes in
the new release.

Before releasing, manually inspect the changelog to be published (quoting from the `.release` job):

```sh
# Make sure you're on master, clean working tree.
npm run scripts -- release minor
npm --silent run scripts -- get-release-notes
```

> Note: If you've have mentioned the current version in the docs somewhere and you don't want it to
> be changed make sure to exclude it in the release script.

A release can be created by a maintainer triggering one of the release jos in the pipeline for the
`main` branch.

We support the following releases:

- prerelease --identifier test - Internal testing or testing with clients
- patch - Backward-compatible bug fixes
- minor - Backward-compatible new features or significant updates

> **Note**: Migrations are still added manually. Make sure the release matches any new migrations.
> For example, if you’re releasing version `1.2.3`, make sure existing migrations in
> `./packages/server/migrations/` are no higher than `1.2.3`.

[dnsmasq]: http://www.thekelleys.org.uk/dnsmasq/doc.html
[keep a changelog]: https://keepachangelog.com/en/1.0.0
[rfc 2606]: https://tools.ietf.org/html/rfc2606

## Documentation

All Appsemble documentation can be found on the site's [Documentation](https://appsemble.app/docs)
page. This page renders the markdown documents from `packages/studio/pages/docs/`. When creating
documentation, make sure to keep everything in the right categories.

- **Studio**: Everything relating to the studio
- **App**: Core concepts of an Appsemble app
- **Guides**: Individual Appsemble features
- **Development**: Documentation on the Appsemble codebase
- **Deployment**: Topics on deploying an Appsemble app
- **Actions**: Each app action explained in detail. These are mostly generated by their API schemas.
- **Remappers**: Each remapper explained in detail. These are mostly generated by their API schemas.
- **Reference**: List of all properties available in an app. These are taken from their API schemas.
- **Packages**: Documentation of the various packages that Appsemble consists of. These are
  generated from each package's README file.

### Reducing duplication

When writing documentation, try to reduce duplication as much as possible. If you find yourself
writing the same thing in multiple places, consider creating a reusable component or snippet.

Avoid repeating generated documentation. For example, if you're documenting an action, you don't
need to explain what the action does, as this is already explained in the action schema's
description. You don't need to list all the required properties or their meaning, only edge cases or
extra information not already covered by the generated reference.

### Highlighting

If you're making documentation on a certain feature it might be a good idea to highlight some
specific parts for clarification.

For example, in the following image we are trying to show what a tab page looks like. By just
showing the page in its entirety it's not immediately clear what each element does. Highlighting
individual parts and clarifying what they are makes it easier for the reader to understand how the
feature works.

![Tab page example](./packages/studio/pages/docs/guides/assets/tab-page-example.png 'Tab page example')

When making a highlight, please try to follow these guidelines for styling:

- **Border/text color**: #ED1C24
- **Border width**: 5px
- **Font**: Calibri
- **Font size**: 40

If these don't look right in your case, feel free to change the styling until it fits.
