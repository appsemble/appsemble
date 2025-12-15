The eslint configuration used for Appsemble projects.

# Usage

First, install the package as a dev dependency.

```sh
npm install --save-dev @appsemble/eslint-config
```

You can then either export it as-is in your eslint config:

`eslint.config.js`
```js
export { default } from '@appsemble/eslint-config';
```

Or you can use it to extend your own eslint configuration:

`eslint.config.js`
```js
import { defineConfig } from 'eslint/config';
import appsembleConfig from '@appsemble/eslint-config';

export default defineConfig([
  ...appsembleConfig,

  // The rest of your config
])
```
