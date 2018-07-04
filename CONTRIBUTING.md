# Contributing

## Code structure

The project roughly has the following file structure

```
┣━ apps/
┃   ┗━ <name>/
┃       ┗━ app.yaml
┣━ blocks/
┃   ┣━ dist/
┃   ┃   ┗━ manifest.json
┃   ┣━ src/
┃   ┗━ package.json
┣━ src/
┃   ┃━ actions/
┃   ┃   ┣━ index.jsx
┃   ┃   ┗━ <action>.jsx
┃   ┣━ components/
┃   ┃   ┗━ <Component>/
┃   ┃       ┣━ index.jsx
┃   ┃       ┣━ messages.jsx
┃   ┃       ┣━ <Component>.css
┃   ┃       ┗━ <Component>.jsx
┃   ┣━ utils/
┃   ┣━ index.css
┃   ┣━ index.html
┃   ┗━ index.jsx
┗━ packages/
```

### apps

Each subdirectory in *apps/* contains an app definition. At the moment of writing, this consistes merely of an *app.yaml* file, but more files may be included in the future.

### blocks

Each subdirectory in *blocks/* defines an Appsemble block. Each block consists of a *package.json*, which defines some metadata about the block, a *src/* directory, which holds the source code of the block, and a *dist/* directory, which holds the output of a build of the block.

Simple blocks are written in vanilla JavaScript. However, if a block gets more complex, React is used. In this case the same directory is used as for the top level *[src/](#src)* directory.

### packages

The packages directory contains any reusable packages. These packages may or may not eventually be extracted into their own project.

### src

The *src/* directory holds the code of the core of the project.

#### actions

The *actions* folder contains the [Redux] code. Each file exposes a series of action creators using named exports. The reducer is exported using the default export.

*index.jsx* re-exports every reducer.

#### components

Each React component is defined in its own dedicated directory. The component itself is defined in a file named after the component itself. The component is exported through *index.jsx*. If any decorators need to be applied to the component, such as Redux’ *connect* or React Router’s *withRouter*, this is typically done in *index.jsx* as well.

CSS modules are used. This allows to define CSS in a *.css* file on a component level. The CSS for each component is defined in a css file named after the component. If the top level node of a component is styled, the CSS class should be `root`.

If a component displays any user facing texts, these should be translated. The translations are defined in *messages.jsx*. The default locale is always *en-US*.

#### utils

The *utils/* directory contains several uncategorized utility functions. Note that many utility functions may already exist in [lodash] or in other popular packages on [npmjs].

## Style guide

This project follows the [Airbnb JavaScript Style Guide], with the following exceptions:

- React components should always be defined using classes.

The code is linted using [ESLint] and [Stylelint].

## Testing

Test files are placed in the same location as the file that’s under test, except that the test file has a *.test* postfix. Not everything is tested yet. However, please make sure existing tests keep working. To run tests, simply run

```sh
yarn test
```

To run tests for a single file, run

```sh
yarn test path/to/file.test.jsx
```

## Committing

Please keep commits small and focused. Only commit the code that is relevant to the change. This will make it much more likely the change will get merged.

**Pro tip**: Use `commit add -p`.

The [Angular commit message convention] is used for commit messages. GitLab will reject commits if the commit message is too far off.

[airbnb javascript style guide]: https://github.com/airbnb/javascript
[angular commit message convention]: https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit
[css modules]: https://github.com/css-modules/css-modules
[eslint]: https://eslint.org
[lodash]: https://www.npmjs.com/package/lodash-es
[npmjs]: https://www.npmjs.com
[redux]: https://redux.js.org
[stylelint]: https://stylelint.io
