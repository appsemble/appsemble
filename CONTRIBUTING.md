# Contributing

## Code structure

The project roughly has the following file structure

```
┣━ apps/
┃   ┗━ <name>/
┃       ┗━ app.yaml
┣━ api/
┃   ┃━ api/
┃   ┃━ controllers/
┃   ┃━ middleware/
┃   ┃━ models/
┃   ┃━ routes/
┃   ┃━ templates/
┃   ┗━ utils/
┣━ app/
┃   ┃━ actions/
┃   ┃   ┣━ index.jsx
┃   ┃   ┗━ <action>.jsx
┃   ┣━ components/
┃   ┃   ┗━ <Component>/
┃   ┃       ┣━ index.jsx
┃   ┃       ┣━ messages.jsx
┃   ┃       ┣━ <Component>.css
┃   ┃       ┗━ <Component>.jsx
┃   ┣━ service-worker/
┃   ┣━ utils/
┃   ┣━ index.css
┃   ┣━ index.jsx
┃   ┗━ package.json
┣━ editor/
┃   ┃━ actions/
┃   ┃   ┣━ index.jsx
┃   ┃   ┗━ <action>.jsx
┃   ┣━ components/
┃   ┃   ┗━ <Component>/
┃   ┃       ┣━ index.jsx
┃   ┃       ┣━ messages.jsx
┃   ┃       ┣━ <Component>.css
┃   ┃       ┗━ <Component>.jsx
┃   ┣━ index.css
┃   ┣━ index.jsx
┃   ┗━ package.json
┣━ blocks/
┃   ┗━ package.json
┗━ packages/
```

### api

The _api/_ directory holds the code of the backend API. The backend API uses [OpenAPI 2.0][openapi].

#### api/api

This directory contains the [OpenAPI] specification, split into managable chunks.

#### api/controllers

The _controllers/_ directoy contains the business logic for each API call. The calls are categorized
by the resource they apply to.

#### api/middleware

This directory holds miscellaneous Koa middlewares.

#### api/models

This directory contains all database model definitions.

#### api/routes

The _routes/_ directory contains any route definitions that are not related to the REST API. For
example the loading of browser related app assets.

#### api/templates

<!-- XXX make this more general purpose -->

This directory contains email templates.

#### api/utils

The _utils/_ directory contains several uncategorized utility functions. Note that many utility
functions may already exist in [lodash] or in other popular packages on [npmjs].

### app

The _app/_ directory holds the code of the frontend web app.

#### app/actions

The _actions_ folder contains the [Redux] code. Each file exposes a series of action creators using
named exports. The reducer is exported using the default export.

_index.jsx_ re-exports every reducer.

#### app/components

Each React component is defined in its own dedicated directory. The component itself is defined in a
file named after the component itself. The component is exported through _index.jsx_. If any
decorators need to be applied to the component, such as Redux’ _connect_ or React Router’s
_withRouter_, this is typically done in _index.jsx_ as well.

CSS modules are used. This allows to define CSS in a _.css_ file on a component level. The CSS for
each component is defined in a css file named after the component. If the top level node of a
component is styled, the CSS class should be `root`.

If a component displays any user facing texts, these should be translated. The translations are
defined in _messages.jsx_. The default locale is always _en-US_.

#### app/service-worker

This contains the service worker that is used by Appsemble. The service worker is shared by all
apps, and makes sure they work offline.

#### app/utils

The _utils/_ directory contains several uncategorized utility functions. Note that many utility
functions may already exist in [lodash] or in other popular packages on [npmjs].

### apps

Each subdirectory in _apps/_ contains an app definition. At the moment of writing, this consistes
merely of an _app.yaml_ file, but more files may be included in the future.

### blocks

Each subdirectory in _blocks/_ defines an Appsemble block. Each block consists of a _package.json_,
which defines some metadata about the block, and the source code.

Simple blocks are written in vanilla JavaScript. However, if a block gets more complex, React is
used. In this case the same directory structure is used as for the top level _[app/](#app)_
directory.

### editor

This folder holds the source code for the app editor. Since this is another React app, it follows
the same structure as the app directory.

### packages

The packages directory contains any reusable packages. These packages may or may not eventually be
extracted into their own project.

## Style guide

### JavaScript

This project uses Prettier. The code is linted using [ESLint]. Apart from that it follows the
[Airbnb JavaScript Style Guide] as closely as possible, with the following exceptions:

- React components should always be defined using classes.

### CSS

This project uses Prettier. The code is linted using [Stylelint]. For a detailed view of the
ruleset, see [stylelint.config.js](./stylelint.config.js).

## Testing

Test files are placed in the same location as the file that’s under test, except that the test file
has a _.test_ postfix. Not everything is tested yet. However, please make sure existing tests keep
working. To run tests, simply run

```sh
yarn test
```

To run tests for a single file, run

```sh
yarn test path/to/file.test.jsx
```

## Committing

Please keep commits small and focused. Only commit the code that is relevant to the change. This
will make it much more likely the change will get merged.

**Pro tip**: Use `commit add -p`.

The [Angular commit message convention] is used for commit messages. GitLab will reject commits if
the commit message is too far off.

In short, this means a commit message should use the following layout:

```
<type>(<scope>): <subject>

<body>
```

### Type

Type must be one of the following:

- build: Changes that affect the build system or external dependencies. (For example changes to
  Webpack configurations)
- ci: Changes to our CI configuration files and scripts. (For example changes to _.gitlab-ci.yml_)
- docs: Documentation only changes. (For example updates to _README.md_)
- feat: A new feature.
- fix: A bug fix.
- perf: A code change that improves performance.
- refactor: A code change that neither fixes a bug nor adds a feature. (For example if code is moved
  to another file, or split into smaller chunks.)
- style: Changes that do not affect the meaning of the code. (For example if code formatting has
  changed.)
- test: Adding missing tests or correcting existing tests.

### Scope

Scope should be one of the following:

- **api**
- **app**
- **block**
- **editor**

If the change doesn’t fit in one of these scopes, or the scope is unclear, it should be omitted.

### Subject

The subject should describe the change in a short line using the imperative tense. The first letter
should be lower case and the subject should not use punctuation.

### Body

A detailed describtion of the change. It is recommended to use markdown syntax.

## Changelog

A changelog is kept following the [keep a changelog] format. Please update it for any notable
changes.

[airbnb javascript style guide]: https://github.com/airbnb/javascript
[angular commit message convention]:
  https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit
[css modules]: https://github.com/css-modules/css-modules
[eslint]: https://eslint.org
[keep a changelog]: https://keepachangelog.com/en/1.0.0
[lodash]: https://www.npmjs.com/package/lodash-es
[npmjs]: https://www.npmjs.com
[openapi]: https://swagger.io/specification/v2/
[redux]: https://redux.js.org
[stylelint]: https://stylelint.io
