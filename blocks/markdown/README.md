A simple block that can display content based on [Markdown] input.

It can be used to provide content to pages, for example a list of external links or to further
explain the other blocks found on a page.

## Example

It is recommended to use a YAML ´literal block´, as shown in the example below.

```yaml
type: markdown
version: 0.35.3-test.0
parameters:
  content: |
    > Do Androids Dream of Electric Sheep?

    *Novel by Philip K. Dick*

    ## Example Table

    | Tables        | Are           | Cool  |
    | ------------- |---------------|-------|
    | example 1     | column 2      | 12345 |
    | example 2     | column 2      |   123 |
    | example 3     | column 2      |    23 |
```

### Images

![Markdown screenshot](https://gitlab.com/appsemble/appsemble/-/raw/0.35.3-test.0/config/assets/markdown.png)

[markdown]: https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
