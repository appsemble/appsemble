# Contributing

## Code structure

The project roughly has the following file structure

```
┣━ apps/
┃   ┗━ <name>/
┃       ┗━ app.yaml
┣━ server/
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

### `server`

The _server/_ directory holds the code of the server back end. The back end includes an API that
uses [OpenAPI 2.0][openapi] and logic for the required server side rendering.

#### `server/api`

This directory contains the [OpenAPI] specification, split into manageable chunks.

#### `server/controllers`

The _controllers/_ directory contains the business logic for each API call. The calls are
categorized by the resource they apply to.

#### `server/middleware`

This directory holds miscellaneous Koa middlewares.

#### `server/models`

This directory contains all database model definitions.

#### `server/routes`

The _routes/_ directory contains any route definitions that are not related to the REST API. For
example the loading of browser related app assets.

#### `server/templates`

<!-- XXX make this more general purpose -->

This directory contains email templates.

#### `server/utils`

The _utils/_ directory contains several uncategorized utility functions. Note that many utility
functions may already exist in [`lodash`] or in other popular packages on [npmjs].

### `app`

The _app/_ directory holds the code of the front end web app.

#### `app/actions`

The _actions_ folder contains the [Redux] code. Each file exposes a series of action creators using
named exports. The reducer is exported using the default export.

_index.jsx_ re-exports every reducer.

#### `app/components`

Each React component is defined in its own dedicated directory. The component itself is defined in a
file named after the component itself. The component is exported through _index.jsx_. If any
decorators need to be applied to the component, such as `redux` `connect` or React Router’s
`withRouter`, this is typically done in _index.jsx_ as well.

CSS modules are used. This allows to define CSS in a `.css` file on a component level. The CSS for
each component is defined in a CSS file named after the component. If the top level node of a
component is styled, the CSS class should be `root`.

If a component displays any user facing texts, these should be translated. The translations are
defined in _messages.jsx_. The default locale is always _en-US_.

#### `app/service-worker`

This contains the service worker that is used by Appsemble. The service worker is shared by all
apps, and makes sure they work offline.

#### `app/utils`

The _utils/_ directory contains several uncategorized utility functions. Note that many utility
functions may already exist in [`lodash`] or in other popular packages on [npmjs].

### `apps`

Each subdirectory in _apps/_ contains an app definition. At the moment of writing, this consists
merely of an _app.yaml_ file, but more files may be included in the future.

### `blocks`

Each subdirectory in _blocks/_ defines an Appsemble block. Each block consists of a _package.json_,
which defines some metadata about the block, and the source code.

Simple blocks are written in vanilla JavaScript. However, if a block gets more complex, React is
used. In this case the same directory structure is used as for the top level _[app/](#app)_
directory.

### `docs`

The _docs_ directory contains documentation that will be rendered on [appsemble.dev].

### `editor`

This folder holds the source code for the app editor. Since this is another React app, it follows
the same structure as the app directory.

### `packages`

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
has a _.test_ suffix. Not everything is tested yet. However, please make sure existing tests keep
working. To run tests, simply run

```sh
yarn test
```

To run tests for a single file, run

```sh
yarn test path/to/file.test.jsx
```

## Changelog

A changelog is kept following the [keep a changelog] format. Please update it for any notable
changes.

[airbnb javascript style guide]: https://github.com/airbnb/javascript
[css modules]: https://github.com/css-modules/css-modules
[dev.appsemble.io]: https://dev.appsemble.io
[eslint]: https://eslint.org
[keep a changelog]: https://keepachangelog.com/en/1.0.0
[lodash]: https://www.npmjs.com/package/lodash-es
[npmjs]: https://www.npmjs.com
[openapi]: https://swagger.io/specification/v2/
[redux]: https://redux.js.org
[stylelint]: https://stylelint.io
[appsemble.dev]: https://appsemble.dev
