# Appsemble SDK

> Build your own blocks

## Getting started

Register a bootstrap function.

```js
import { bootstrap } from '.';


bootstrap(({ shadowRoot }) => {
  const root = document.createElement('span');
  root.innerText = 'Hello world!';
  shadowRoot.appendChild(root);
});
```

**Note**: The script will be loaded only once. The bootstrap function is then called for every instance of your block type that is loaded by the app creator.
