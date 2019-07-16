# JSX DOM

> Use JSX to create DOM elements.

All properties are assigned to the element as-is. This means for example `onclick` should be used,
not `click` or `onClick`, and `className` should be used, not `class`.

```tsx
/* @jsx h */
import h from '@appsemble/jsx-dom';

export default <button className="is-primary" onclick={() => {}} type="button" />;
```
