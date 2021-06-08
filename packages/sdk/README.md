# Appsemble SDK

> Build your own blocks

## Installation

```sh
npm install @appsemble/sdk
```

## Getting started

Register a bootstrap function.

```js
import { bootstrap } from '@appsemble/sdk';

bootstrap(() => {
  const root = document.createElement('span');
  root.textContent = 'Hello world!';
  return root;
});
```

**Note**: The script will be loaded only once. The bootstrap function is then called for every
instance of your block type that is loaded by the app creator.
