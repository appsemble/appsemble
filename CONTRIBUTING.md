# ![](config/assets/logo.svg) Contributing

## Translating

Our translations are community driven by
[![](https://hosted.weblate.org/static/logo-16.png) Weblate](https://weblate.org). The Appsemble
project on Weblate can be found [here](https://hosted.weblate.org/engage/appsemble)

[![Translation status](https://hosted.weblate.org/widgets/appsemble/-/appsemble/multi-auto.svg 'Translation status')](https://hosted.weblate.org/engage/appsemble/)

New languages can be added [here](https://hosted.weblate.org/projects/appsemble/appsemble/).

## Development

### Style guide

The entire code base is formatted using
[![](https://avatars.githubusercontent.com/u/25822731?s=16) Prettier](https://prettier.io).

#### JavaScript / TypeScript

JavaScript and TypeScript code are linted using
[![](https://avatars.githubusercontent.com/u/6019716?s=16) ESLint](https://eslint.org).

#### CSS

CSS styles are linted using
[![](https://avatars.githubusercontent.com/u/10076935?s=16) Stylelint](https://stylelint.io).

#### Markdown

Markdown documents are linted using
[![](https://avatars.githubusercontent.com/u/16309564?s=16) Remark lint](https://github.com/remarkjs/remark-lint)

### Testing

Appsemble uses [![](https://jestjs.io/img/favicon/favicon-16x16.png) Jest](https://jestjs.io) for
unit testing. Test files are placed in the same location as the file that’s under test, except that
the test file has a _.test_ suffix. Not everything is tested yet. However, please make sure existing
tests keep working. To run tests, simply run the command below. Any jest arguments are supported.

```sh
yarn test
```

To run tests for a single file, run

```sh
yarn test path/to/file
```

#### End 2 End Tests

The end 2 end tests are run using
[![](https://avatars.githubusercontent.com/u/8908513?s=16) Cypress](https://www.cypress.io). They
reside in [`packages/e2e`](packages/e2e).

### Changelog

Every block and package has a `changes` directory. This directory contains the following folders:

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

A release can be created by a maintainer triggering the `release patch` or `release minor` job in
the pipeline for the `main` branch.

> **Note**: Migrations are still added manually. Make sure the release matches any new migrations.

[dnsmasq]: http://www.thekelleys.org.uk/dnsmasq/doc.html
[keep a changelog]: https://keepachangelog.com/en/1.0.0
[rfc 2606]: https://tools.ietf.org/html/rfc2606
