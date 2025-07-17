# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.33.11/config/assets/logo.svg) Appsemble Preact SDK

> Build your own blocks using Preact

[![npm](https://img.shields.io/npm/v/@appsemble/preact)](https://www.npmjs.com/package/@appsemble/preact)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.33.11/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.33.11)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [`bootstrap()`](#bootstrap)
  - [`useBlock()`](#useblock)
  - [`<FormattedMessage />`](#formattedmessage-)
- [License](#license)

## Installation

```sh
npm install @appsemble/preact preact
```

## Usage

This package integrates [Preact](https://preactjs.com) with
[`@appsemble/sdk`](https://www.npmjs.com/package/@appsemble/sdk). Please read the documentation for
a better understanding of how to use it.

### `bootstrap()`

The bootstrap function takes a Preact component as an argument and renders. It takes the Appsemble
block context as its props, extended with the `ready()` function. The `ready()` function needs to be
called when the block is done rendering. Actions won’t be finalized for any blocks on the page,
until all blocks are ready.

```tsx
import { bootstrap } from '@appsemble/preact';
import { useEffect } from 'preact/hooks';

bootstrap(({ actions }) => {
  useEffect(() => {
    ready();
  }, []);

  return (
    <button onClick={() => actions.onClick()} type="button">
      Hello world!
    </button>
  );
});
```

**Note**: The script will be loaded only once. The component is then bootstrapped for every instance
of your block type that is loaded by the app creator.

### `useBlock()`

Get the block context. This is available for components that are rendered within a subtree of a
component rendered by [`bootstrap`](#bootstrap)

```tsx
import { useBlock } from '@appsemble/preact';
import { type VNode } from 'preact';

export function MyButton(): VNode {
  const { actions } = useBlock();

  return (
    <button onClick={() => actions.onClick()} type="button">
      Hello world!
    </button>
  );
}
```

### `<FormattedMessage />`

This helper component renders a translated message ID.

```tsx
import { FormattedMessage } from '@appsemble/preact';
import { type VNode } from 'preact';

interface MyButtonProps {
  readonly name: string;
}

export function MyButton({ name }: MyButtonProps): VNode {
  return (
    <button type="button">
      <FormattedMessage id="myButtonLabel" values={{ name }} />
    </button>
  );
}
```

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.33.11/LICENSE.md) ©
[Appsemble](https://appsemble.com)
