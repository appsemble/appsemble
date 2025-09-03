# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.34.12/config/assets/logo.svg) Appsemble SDK

> Build your own blocks

[![npm](https://img.shields.io/npm/v/@appsemble/sdk)](https://www.npmjs.com/package/@appsemble/sdk)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.34.12/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.34.12)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [`bootstrap`](#bootstrap)
  - [TypeScript interfaces](#typescript-interfaces)
    - [Parameters](#parameters)
    - [Actions](#actions)
    - [Events](#events)
    - [Messages](#messages)
- [License](#license)

## Installation

```sh
npm install @appsemble/sdk
```

## Usage

### `bootstrap`

The bootstrap function registers a function which gets called every time a new instance of the block
is created. If the block returns a DOM Node, it’s attached to the block’s shadow root.

The function may be asynchronous, but should not wait for actions to have finished, as actions are
delayed until all blocks on a page are ready.

```js
import { bootstrap } from '@appsemble/sdk';

bootstrap(({ utils }) => {
  const root = document.createElement('span');
  root.textContent = utils.formatMessage('hello');
  return root;
});
```

### TypeScript interfaces

Various block settings can be defined by augmenting interfaces in `@appsemble/sdk`. This allows you
as a block developer to work in a type safe manner, while providing validation and documentation for
users implementing your block in their app.

#### Parameters

Block parameters can be defined by augmenting the `@appsemble/sdk#Parameters` interface. The
Appsemble CLI will automatically create a JSON schema from these type definitions. This includes the
TSDoc comments. It’s highly recommended to properly document this interface, as generated
documentation is user-facing. JSON schema properties can be written as TSDoc tags. Markdown is
supported in descriptions.

```ts
declare module '@appsemble/sdk' {
  interface Parameters {
    /**
     * This is an example string parameter.
     *
     * @format email
     * @maxLength 50
     * @minLength 10
     * @pattern ^.+@.*+\..+$
     * @example 'Example string'
     */
    exampleString: string;

    /**
     * This is an number parameter.
     *
     * @type integer
     * @maximum 1337
     * @minimum 42
     * @multipleOf 3
     * @example 123
     */
    exampleNumber: number;
  }
}
```

#### Actions

Block actions can be defined by augmenting the `@appsemble/sdk#Action` interface. Only the action
keys and TSDoc descriptions are used. Markdown is supported in descriptions.

```ts
declare module '@appsemble/sdk' {
  interface Action {
    /**
     * This is an example action.
     */
    onClick: never;
  }
}
```

#### Events

Block event emitters can be defined by augmenting the `@appsemble/sdk#EventEmitters` interface.
Block event listeners can be defined by augmenting the `@appsemble/sdk#EventListeners` interface.
For both emitters and listeners, only the keys and TSDoc descriptions are used. Markdown is
supported in descriptions.

```ts
declare module '@appsemble/sdk' {
  interface EventEmitters {
    /**
     * This is an example event emitter.
     */
    data: never;
  }

  interface EventListeners {
    /**
     * This is an example event listener.
     */
    refresh: never;
  }
}
```

#### Messages

Block messages can be defined by augmenting the `@appsemble/sdk#Messages` interface. The values of
these properties are used for type safety when calling `utils.formatMessage()`. Markdown is
supported in descriptions.

```ts
declare module '@appsemble/sdk' {
  interface Messages {
    /**
     * This message doesn’t support variables
     */
    bye: never;

    /**
     * This message accepts a variable named `name`.
     */
    hello: {
      name: string;
    };
  }
}
```

## License

[LGPL-3.0-only](https://gitlab.com/appsemble/appsemble/-/blob/0.34.12/LICENSE.md) ©
[Appsemble](https://appsemble.com)
