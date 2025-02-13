# What is a page

A page is an individual webpage in your app. Ideally, each page has its own isolated purpose like
displaying a list of employees or creating a new "todo" item.

To get a basic understanding of how a page works, read the introduction of the page docs:

- [Page docs introduction](/docs/app/page#page)

As an example, this is what a page definition can look like:

```yaml copy
name: People list
blocks:
    # Loading list of people
  - type: data-loader
    ...
    # Displaying people data
  - type: list
    ...
```

This page is responsible for displaying a list of people that are stored in the app. There is a
block that loads the people, and a block that displays the people. This example is simplified so
that the actual block logic is not shown. We'll get into this more in the next modules.
