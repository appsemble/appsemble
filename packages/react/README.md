# Appsemble React SDK

> Build your own blocks using React

## Installation

```sh
npm install @appsemble/react
```

## Hello world example

```js
import { bootstrap } from '@appsemble/react';
import PropTypes from 'prop-types';
import React from 'react';

class MyBlock extends React.Component {
  static propTypes = {
    actions: PropTypes.shape().isRequired,
  };

  render() {
    const { actions } = this.props;

    return (
      <button onClick={actions.click.dispatch} type="button">
        Hello world!
      </button>
    );
  }
}

bootstrap(MyBlock);
```

**Note**: The script will be loaded only once. The component is then bootstrapped for every instance
of your block type that is loaded by the app creator.
