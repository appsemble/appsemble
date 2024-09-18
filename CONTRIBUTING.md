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
| community   | suggested: plain js / preact / mini-jsx | no          | varies                                                    |

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

After adding a new permission to the `Permission` enum, add the permission to the relevant role at
`packages/utils/constants/roles.ts`. Similarly add the permission and it’s description to
`packages/studio/pages/organizations/messages.ts`.

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

#### End 2 End Tests

The end 2 end tests are run using
[![](https://avatars.githubusercontent.com/u/89237858?s=16) Playwright](https://playwright.dev).
They reside in [`packages/e2e`](packages/e2e).

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

A release can be created by a maintainer triggering the `release patch` or `release minor` job in
the pipeline for the `main` branch.

> **Note**: Migrations are still added manually. Make sure the release matches any new migrations.
> For example, if you’re releasing version `1.2.3`, make sure existing migrations in
> `./packages/server/migrations/` are no higher than `1.2.3`.

[dnsmasq]: http://www.thekelleys.org.uk/dnsmasq/doc.html
[keep a changelog]: https://keepachangelog.com/en/1.0.0
[rfc 2606]: https://tools.ietf.org/html/rfc2606
