# Contributing

## Translating

Our translations are community driven by [Weblate](https://weblate.org). The Appsemble project on
Weblate can be found [here](https://hosted.weblate.org/projects/engage/appsemble)

[![Translation status](https://hosted.weblate.org/widgets/appsemble/-/appsemble/multi-auto.svg 'Translation status')](https://hosted.weblate.org/engage/appsemble/)

To request a new language, please create an issue in our
[issue tracker](https://gitlab.com/appsemble/appsemble/-/issues).

## Development

### Style guide

#### JavaScript

This project uses Prettier. The code is linted using [ESLint].

### CSS

This project uses Prettier. The code is linted using [Stylelint]. For a detailed view of the
ruleset, see [stylelint.config.js](./stylelint.config.js).

### Testing

Test files are placed in the same location as the file that’s under test, except that the test file
has a _.test_ suffix. Not everything is tested yet. However, please make sure existing tests keep
working. To run tests, simply run

```sh
yarn test
```

To run tests for a single file, run

```sh
yarn test path/to/file
```

### Changelog

Every block and package has a `changes` directory. This directory contains the following folders:

- `added`
- `changed`
- `deprecated`
- `removed`
- `fixed`
- `security`

A single line changelog entry should be placed in one of these folders for any significant change. A
single imperative sentence is preferred. If the folder doesn’t exist, it should be created.

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
http://foo.bar.localhost:9999. If this serves something, it works.

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

This section is only for Appsemble maintainers.

The release process hasn’t been fully automated yet. In order to create a release, perform the
following steps:

- Make sure you’re on the latest master branch.
- Create a new branch.
- Run `yarn scripts release patch` or `yarn scripts release minor` respectively.
- Update the changelog.
- Verify and commit the results.
- Push.
- Create a merge request. Use the changes in the changelog as the merge request description. This
  does not include the header of the tag itself.
- Once merged, create a git tag. Use the changes in the changelog as the release notes. This does
  not include the header of the tag itself. The tag message should be left empty.

CI will take care of the rest.

[dnsmasq]: http://www.thekelleys.org.uk/dnsmasq/doc.html
[eslint]: https://eslint.org
[keep a changelog]: https://keepachangelog.com/en/1.0.0
[rfc 2606]: https://tools.ietf.org/html/rfc2606
[stylelint]: https://stylelint.io
