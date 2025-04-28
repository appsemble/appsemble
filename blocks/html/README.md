A block that can be used to display HTML content as-is.

It can be used to customize the appearance of elements on a page and has a couple of built-in
utilities to assist with injecting text, including assets, and assigning click events.

To inject the URL of an asset, apply the `data-asset` attribute to an appropriate element:

```html
<img data-asset="my-asset-id" />
```

To replace the text content of an element, apply the `data-content` attribute:

```html
<span data-content="myTestContent" />
```

```yaml
blocks:
  - type: html
    version: 0.32.2-test.2
    parameters:
      placeholders:
        myTestContent: Hello this is replaced content using a remapper!
      content: |
        <span data-content="myTestContent" />
```

To add a click handler to a button, apply the `data-click` attribute:

```html
<button data-click="onTestClick" type="button">This is a test button</button>
```

```yaml
blocks:
  - type: html
    version: 0.32.2-test.2
    actions:
      onTestClick:
        type: link
        to: Some other page
    parameters:
      content: |
        <button data-click="onTestClick" type="button">This is a test button</button>
```

As with every Appsemble block, all [Bulma](https://bulma.io) classes and the free
[Font Awesome](https://fontawesome.com/icons?m=free) icon set is available.

```html
<button class="button" type="button">
  <span class="icon">
    <i class="fas fa-smile"></i>
  </span>
</button>
```
