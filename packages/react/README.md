# Appsemble React SDK

> Build your own blocks using React

## Installation

```sh
npm install @appsemble/react
```

## Hello world example

```tsx
import { bootstrap } from '@appsemble/react';
import React from 'react';

bootstrap(({ actions }) => (
  <button onClick={actions.click.dispatch} type="button">
    Hello world!
  </button>
));
```

**Note**: The script will be loaded only once. The component is then bootstrapped for every instance
of your block type that is loaded by the app creator.
