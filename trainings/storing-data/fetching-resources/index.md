# Fetching resources

You likely want to display the data you've stored in a resource in a block. To achieve this you must
first fetch the resources. There are a number of ways to do this, but we'll go over the basics here.

## Fetching all resources

The most common way of fetching resources is by using the
[resource.query](/docs/actions/resources#resourcequery) action. This fetches all the entries in a
resource. You can specify this query further using [views](/docs/guides/resource-views) or
[filters](/docs/guides/filtering-queries)

The query action fetches all entries, so we can use this to display the contents of our resource in
a table block.

To fetch this data once the page loads, we can use the [data-loader](/blocks/@appsemble/data-loader)
block and send it to the [table](/blocks/@appsemble/table) block using events.

```yaml copy block-snippet
type: data-loader
version: 0.30.14-test.7
actions:
  onLoad:
    type: resource.query # Gets all entries in the specified resource
    resource: person
events:
  emit:
    data: people # Emit the fetched data to any event listeners with this key
```

In the table block we can then choose to display this information.

```yaml copy block-snippet
type: table
version: 0.30.14-test.7
events:
  listen:
    data: people # Receive data from event emitters with this key
parameters:
  fields:
    - label: Name # The name of the row
      value: { prop: name } # The value of the row, in this case filled with the name
    - label: Age
      value: { prop: age }
```

## Specific resource using parameters

While you can use filters or remappers (will be discussed in future chapter: **Data
transformation**) to narrow down a specific resource to fetch, this can get messy and difficult to
work with. Instead we can use [page parameters](/docs/app/page#page-parameters) to pass an
identifier to the page directly to fetch a specific resource.

We'll extend the previous example:

```yaml copy block-snippet
type: table
version: 0.30.14-test.7
events:
  listen:
    data: people
parameters:
  fields:
    - label: Name
      value: { prop: name }
    - label: Age
      value: { prop: age }
actions:
  # This action gets called whenever the user clicks on a row
  # The data of that specific row is made accessible to the ActionDefinition
  onClick:
    type: link # The link action redirects the user to the page defined under the 'to' property
    to: Details # While not displayed directly, all the data from this ActionDefinition is sent to the 'Details' page
```

Now whenever the user clicks on one of the table rows they get sent to the "Details" page. When the
user clicks on the row, the `onClick` action gets called. The data from the row they clicked gets
passed to the ActionDefinition, allowing you to define actions that target that specific resource.

When we then redirect to the "Details" page, the data from the ActionDefinition gets sent along.
That data can then be accessed using
[page parameters](/docs/reference/app#-page-definition-parameters).

Let's create the Details page. This page is responsible for displaying the detailed information of a
specific user:

```yaml
name: Details
parameters:
  - id
blocks:
  - type: data-loader
    version: 0.30.14-test.7
    actions:
      onLoad:
        type: resource.get # Takes the 'id' page parameter and uses it to get a resource with that ID
        resource: person
```

This block gets the resource that matches the ID of the parameter that was sent from the previous
page. Now this entire page can easily be dedicated to that specific resource.

There is lots more that you can do with resources. Information about these can be found here:

- [Expiring resources](/docs/guides/expiring-resources)
- [External resources](/docs/guides/external-resources)
- [Filtering queries](/docs/guides/filtering-queries)
- [Resource referencing](/docs/guides/resource-referencing)
- [Resource views](/docs/guides/resource-views)
- [Sharing resources](/docs/guides/sharing-resources)
