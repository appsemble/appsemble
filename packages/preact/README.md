# Appsemble Preact SDK

> Build your own blocks using Preact

## Installation

```sh
npm install @appsemble/preact preact@next
```

## Hello world example

```tsx
import { bootstrap } from '@appsemble/preact';
import React from 'react';

function MyBlock({ actions }) {
  return (
    <button onClick={actions.onClick.dispatch} type="button">
      Hello world!
    </button>
  );
}

bootstrap(MyBlock);
```

**Note**: The script will be loaded only once. The component is then bootstrapped for every instance
of your block type that is loaded by the app creator.
