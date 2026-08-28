Use this block to add a footer with link lists, images, and copyright text to a page.

Each entry in `columns` is either a `links` column or an `image` column. Link labels, column titles,
image fields, visibility, and copyright text support remappers. A link item can reference any
configured action. Link actions render as anchors and other actions render as buttons.

Images open an enlargement by default. App assets can also be downloaded from the enlargement. Set
`enlarge` to `false` or to a remapper that resolves to a falsy value to render an image without this
interaction.

See [`examples/footer.yaml`](./examples/footer.yaml) for a complete example.
