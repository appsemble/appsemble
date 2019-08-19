# JSX DOM

> Use JSX to create DOM elements.

All properties are assigned to the element as-is if the attribute exists on the element type.
Otherwise it is assigned as an attribute. This means for example `onclick` should be used, not
`click` or `onClick`.

```jsx
/** @jsx h */
import h from '@appsemble/jsx-dom';

export default (
  <button
    className="is-primary"
    onclick={() => {
      // eslint-disable-next-line no-console
      console.log('Click!');
    }}
    type="button"
  >
    <i className="button" />
    <span>Button text</span>
  </button>
);
```

Alternatively, `h` can be called as a function.

```js
/** @jsx h */
import h from '@appsemble/jsx-dom';

export default h(
  'button',
  {
    className: 'is-primary',
    onclick() {
      // eslint-disable-next-line no-console
      console.log('Click!');
    },
    type: 'button',
  },
  h('i', { className: 'icon' }),
  h('span', null, 'Button text'),
);
```

## Usage With TypeScript

Add the following properties to `compilerOptions` in `tsconfig.json`.

```jsonc
{
  "compilerOptions": {
    // This should always be "react".
    "jsx": "react",
    // Assuming tiny-jsx is imported as "h".
    "jsxFactory": "h",

    "lib": [
      "dom",
      // es2017 or higher is required
      "es2017"
    ]

    // More compiler options…
  }
}
```

## Usage With Babel

Add the following to your babel configuration.

```js
module.exports = () => ({
  plugins: [
    ['@babel/plugin-transform-react-jsx', { pragma: 'h', useBuiltIns: true }],

    // More plugins…
  ],
});
```
