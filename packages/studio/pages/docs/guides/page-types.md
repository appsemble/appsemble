# Page types

You can specify a couple different types of pages that achieve a different functionality. Each page
extends upon the standard page definition, so all the page properties can be used on any of these
variations:

- [Page](../reference/app.mdx#-page-definition)
- [Tabs page](../reference/app.mdx#-tabs-page-definition)
- [Flow page](../reference/app.mdx#-flow-page-definition)
- [Loop page](../reference/app.mdx#-loop-page-definition)
- [Container page](../reference/app.mdx#-container-page-definition)

## Tabs page

![Tab page example](./assets/tab-page-example.png 'Tab page example') _Taken from 'Holidays' app_

Tab pages allow you to define a set of sub-pages under the same main page. These can be defined
using the `tabs` property. Sub pages are a very primitive version of the regular page, only
accepting a `name`, `blocks` and `roles`. The following code is (roughly) used to create the
"Holidays" app from the image above:

```yaml copy
pages:
  - name: Holidays in Europe
    icon: globe-europe
    type: tabs
    tabs:
      - name: Netherlands
        blocks: ...
      - name: Germany
        blocks: ...
      - name: Spain
        blocks: ...
```

If you'd like to see how this works in more detail or mess around with the code yourself, you can
check it out [here](https://appsemble.app/en/apps/10/holidays).

### Dynamic tabs

The regular tabs definition only allows you to set pre-defined pages. With some extra steps, it's
also possible to generate pages dynamically based on incoming data. This is done using the
`definition` property.

The dynamic tab page consists of two flows:

- **Loading the data**: First, you need to make sure the data you want to display gets to the right
  place in the right format.
- **Defining the page template**: With your data format in mind, you need to design the page
  template that your data will populate.

#### Loading the data

Data for the dynamic tabs get loaded using the `event` property. By defining an event listener, you
can get data from any other place in the app. The tab page has its own action for this that you can
use too, namely the `onLoad` action.

In practice, this looks like this:

```yaml copy
name: Knowledgebase
type: tabs
# Retrieve data from resource
actions:
  onLoad:
    type: resource.query
    resource: courseType
    onSuccess:
      type: event
      event: tabs
definition:
  # Load data into dynamic tab definition
  events:
    listen:
      data: tabs
```

The expected data is an **array of objects**, where each object is used to populate a page.

#### Defining the page template

Once you know what the data will look like, you can define the template that the page will use. This
can be entered in the `foreach` property of the `definition` as a regular sub-page.

Let's assume the previously loaded in data looks like this:

```json
[{ "course": "English" }, { "course": "Science" }, { "course": "History" }]
```

And we define the following page template:

```yaml copy
foreach:
  name: { prop: course }
  blocks:
    - type: markdown
      version: 0.30.13
      parameters:
        content:
          string.format:
            template: This is the {course} page
            values:
              course: { tab.name: null }
```

> **Note**: The [`tab.name`](../remappers/data.mdx#tab.name) remapper can be used to retrieve the
> name of the current page.

Then the result will be 3 tab pages called English, Science and History where each tells the user
which course page they are on.

## Flow page

![Flow page example](./assets/flow-page-example.png 'Flow page example') _Taken from 'Survey' app_

The flow page allows you to create a list of sub-pages under one page. Unlike the tabs page, flow
page sub-pages follow a certain order that the user goes through. The app developer has full control
over how the user goes through this order using [flow actions](../actions/flow.mdx#flow)

The base syntax of a flow page looks very much like that of a tabs page:

```yaml copy
pages:
  - name: Survey
    type: flow
    actions:
      onFlowFinish:
        type: log
    steps:
      - name: Introduction
        blocks: ...
      - name: Familiarity
        blocks: ...
      - name: Appsemble Ratings
        blocks: ...
```

The difference is that you need to define actions that determine how to flow between the pages. To
do this you can use the flow actions:

- `flow.next`: Go to the next page
- `flow.back`: Go to the previous page
- `flow.back`: Go to the page at a specific index
- `flow.finish`: Trigger the `onFlowFinish` action
- `flow.cancel`: Trigger the `onFlowCancel` action

If you take the previous code as an example and zoom in on the Introduction page, you get this:

```yaml copy
name: Introduction
blocks:
  - type: markdown
    version: 0.30.13
    layout: static
    parameters:
      content:
        This app is a template app used to demo how a survey app could be created using Appsemble.
  - type: button-list
    version: 0.30.13
    parameters:
      buttons:
        - label: Start
          onClick: onStart
          color: primary
    actions:
      onStart:
        type: flow.next
```

This gives the user some text and a button to navigate to the next page in this order.

Once the flow is finished using the `flow.finish` action, the data of all sub pages is provided to
the action definition. This data is presented as a single object where all the key-value pairs are
based on the form input fields.

## Loop page

The loop page is a dynamic way to make a flow page. On the user side it works exactly the same as a
flow page, but instead of having to statically define the pages you can have them be created
automatically based on incoming data.

This works by defining a template sub-page in the `foreach` parameter, and a way to receive data to
fill in the sub pages in the `onLoad` action. The data in the onLoad is used to populate the page,
so it expects an array of objects, where each object holds the data that should be put in the pages.
You can then access this data using the `step` remapper.

Let's say you want to create a survey to send out to your team every week to measure how they are
feeling at work. You don't want to manually change the app definition every time, you only want to
define a set of questions and have the app do the rest for you. Here is how you could approach this
problem.

First, define what kind of questions you want to ask:

```json
[
  { "question": "How do you feel at work?" },
  { "question": "Do you feel safe at work?" },
  { "question": "Do you like working here?" }
]
```

You can then load these in the `onLoad` action:

```yaml copy
pages:
  - name: Fill in survey
    parameters:
      - id
    type: loop
    actions:
      onLoad:
        type: resource.get
        resource: survey
```

Now that the data gets loaded into the page, you can define a template sub page definition that will
use this data to dynamically create new pages in the `foreach` parameter. You can use the `step`
remapper to access the data that's assigned to that page:

```yaml copy
foreach:
  name: Title
  blocks:
    - type: markdown
      layout: static
      version: 0.30.13
      parameters:
        content: { step: question }
    - type: form
      version: 0.30.13
      layout: grow
      parameters:
        disableDefault: true
        fields:
          - type: string
            name: comment
            multiline: true
            label: Comment
      actions:
        onSubmit:
          type: flow.next
```

This then generates a flow page with 3 sub-pages, each containing a different question.

> **Tip**: The `flow.next` action automatically calls the `onFlowFinish` action if there are no more
> pages to go to.

## Container pages

![Container page example](./assets/container-page-example.png 'Container page example')

Container pages allow you to group several other pages under one page. These pages are then shown in
the side menu nested below the parent page as shown in the example above. In contrary to the
previous page types, these pages are full pages instead of
[sub pages](../reference/app.mdx#-sub-page).

This makes container pages very easy to define, as the syntax is exactly the same as a regular page.
On the parent page, you only need to set the `type` to `container` and define the `pages`.

The example above was created using the following page definition (minus Page 2):

```yaml copy validate page-snippet
- name: Page 1
  type: container
  pages:
    - name: Contained page 1
      blocks:
        - type: action-button
          version: 0.35.7
          parameters:
            icon: git-alt
          actions:
            onClick:
              type: link
              to: Contained page 2
    - name: Contained page 2
      blocks:
        - type: action-button
          version: 0.35.7
          parameters:
            icon: git-alt
          actions:
            onClick:
              type: link
              to: Contained page 1
```
