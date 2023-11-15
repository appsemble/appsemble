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
npm run scripts extract-messages
```

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

A single line changelog entry should be placed in one of these folders for any significant change. A
single imperative sentence is preferred. Changelog entries are added to the
[changelog](CHANGELOG.md) on a release.

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

## Releasing

Before releasing, manually inspect the changelog to be published (quoting from the `.release` job):

```sh
# Make sure you're on master, clean working tree.
npm run scripts release minor
npm --silent run scripts get-release-notes
```

A release can be created by a maintainer triggering the `release patch` or `release minor` job in
the pipeline for the `main` branch.

> **Note**: Migrations are still added manually. Make sure the release matches any new migrations.

[dnsmasq]: http://www.thekelleys.org.uk/dnsmasq/doc.html
[keep a changelog]: https://keepachangelog.com/en/1.0.0
[rfc 2606]: https://tools.ietf.org/html/rfc2606
