# Basic app

Each app has a name, description, and a default page. Notice the name and description have the value
that was entered in the _“Create app”_ dialog.

## Empty app

The newly created app has two pages. On each page, an
[`action-button`](/blocks/@appsemble/action-button) block is rendered.

The icon on the button is specified in the block parameters. Because each block type has different
functionalities, they also accept different types of parameters.

Each block type may also call specific types of actions. In case of the `action-button`, the button
may be clicked. This is why it has an `onClick` event. When the button on _“Example Page A”_ is
clicked, a `link` action is called. This will link the user to _“Example Page B”_. Vice-versa,
_“Example Page B”_ has a button that links to _“Example Page A”_.

## Adding a resource

Resources allow apps to store data in the Appsemble resource API, or to map resources to somewhat
compliant third party APIs. This tutorial will focus on usage with Appsemble’s own resource API.

Add the following to the app definition:

```yaml copy
resources:
  person:
    schema:
      type: object
      required:
        - firstName
        - lastName
        - email
      properties:
        firstName:
          type: string
          maxLength: 80
        lastName:
          type: string
          maxLength: 80
        email:
          type: string
          format: email
        description:
          type: string
          maxLength: 500
```

This may look daunting at first, but it’s not that complicated when given a closer look. This
specified a resource named `person`. Resources have a `schema` property. This `schema` property is a
[JSON schema](https://json-schema.org/draft/2019-09/json-schema-validation.html). Such schemes allow
complex structures, but typically this isn’t needed for resources. The person schema describes an
object which has the properties `firstName`, `lastName`, `email`, and `description`. `firstName` and
`lastName` shouldn’t be too long, whereas `email` should be a valid email address. For example, this
could represent the following data structure:

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@example.com",
  "description": "This is the best smith in town."
}
```

The schema is used as a safety net for invalid data, but also for representation in some places.

When the app is published with the `resources` property, a new “Resources” menu item appears to the
side menu. This way resources can be managed in a generic way from within
[Appsemble studio](studio.md) in an administrator-like fashion.

## Displaying data

Resources exist for use it in the app. A simple way to display data is to add a `table` block. The
table block can display data in an orderly manner in a table.

Let’s replace _“Example Page A”_ and _“Example Page B”_ with a single page, named _“People”_.

```yaml copy
pages:
  - name: People
    blocks:
      - type: table
        version: 0.19.8
        events:
          listen:
            data: people
        parameters:
          fields:
            - value:
                - prop: firstName
              label: First Name
            - value:
                - prop: lastName
              label: Surname
```

The default page must also be changed to `People`, because the `Example Page A` has just been
removed.

```yaml copy
defaultPage: People
```

Now save this app and behold, the app is… loading?

Most blocks rely on data loader block to display data. Notice the table block on the _“People”_ page
doesn’t even reference the `person` resource anywhere. It merely listens on an event called
`people`.

To actually use any data, it must be loaded. Typically this is loaded by a `data-loader` block. This
block then emits the data to other blocks on the page, such as the `table` block.

```mermaid
graph LR
    resource[Resource API] --> data-loader --> table
```

Let’s add such a `data-loader` block.

```yaml copy
pages:
  - name: People
    blocks:
      - type: data-loader
        version: 0.19.8
        actions:
          onLoad:
            type: resource.query
            resource: person
        events:
          emit:
            data: people
      - type: table
        version: 0.19.8
```

When the app is saved, it will start off by showing a spinner. It then quickly turns into some
familiar headers. The data has been loaded. However, there is no data to display, as no people have
been registered yet.

At this point, the total app definition should look like this:

```yaml copy filename="app-definition.yaml"
name: My App
defaultPage: People

resources:
  person:
    schema:
      type: object
      required:
        - firstName
        - lastName
        - email
      properties:
        firstName:
          type: string
          maxLength: 80
        lastName:
          type: string
          maxLength: 80
        email:
          type: string
          format: email
        description:
          type: string
          maxLength: 500

pages:
  - name: People
    blocks:
      - type: data-loader
        version: 0.19.8
        actions:
          onLoad:
            type: resource.query
            resource: person
        events:
          emit:
            data: people
      - type: table
        version: 0.19.8
        events:
          listen:
            data: people
        parameters:
          fields:
            - value:
                - prop: firstName
              label: First Name
            - value:
                - prop: lastName
              label: Surname
```

## Creating data

The easiest way to create new data is through a form. This is exactly what we’ll be creating next.

Add a new page:

```yaml copy
- name: Register
  blocks:
    - type: form
      version: 0.19.8
      actions:
        onSubmit:
          type: resource.create
          resource: person
          onSuccess:
            type: link
            to: People
      parameters:
        fields:
          - name: firstName
            label: First Name
          - name: lastName
            label: Surname
          - name: email
            label: Email Address
            format: email
          - name: description
            label: Description
            multiline: true
```

After saving, the page can be opened from the app’s side menu. When data is entered and the form is
saved, a new person is registered. The user is then redirected to the _“People”_ page. This page now
displays the newly created person.

The app should now look like this:

```yaml copy filename="app-definition.yaml"
name: My App
description: ''
defaultPage: People

resources:
  person:
    schema:
      type: object
      required:
        - firstName
        - lastName
        - email
      properties:
        firstName:
          type: string
          maxLength: 80
        lastName:
          type: string
          maxLength: 80
        email:
          type: string
          format: email
        description:
          type: string
          maxLength: 500

pages:
  - name: Register
    blocks:
      - type: form
        version: 0.19.8
        parameters:
          fields:
            - name: firstName
              label: First Name
            - name: lastName
              label: Surname
            - name: email
              label: Email Address
              format: email
            - name: description
              label: Description
              multiline: true

  - name: People
    blocks:
      - type: data-loader
        version: 0.19.8
        actions:
          onLoad:
            type: resource.query
            resource: person
        events:
          emit:
            data: people
      - type: table
        version: 0.19.8
        events:
          listen:
            data: people
        parameters:
          fields:
            - value:
                - prop: firstName
              label: First Name
            - value:
                - prop: lastName
              label: Surname
```

## Detail view

The detail page only displays person’s first name and last name. Often such an overview is handy,
but it is desired to add the ability to see more details. Another use case might be a form for
editing the resource, but for now we’ll focus on viewing.

Add a new page:

```yaml copy
- name: Person details
  parameters:
    - id
  blocks:
    - type: data-loader
      version: 0.19.8
      actions:
        onLoad:
          type: resource.get
          resource: person
      events:
        emit:
          data: person
    - type: detail-viewer
      version: 0.19.8
      events:
        listen:
          data: person
      parameters:
        fields:
          - value:
              - prop: firstName
            label: First Name
          - value:
              - prop: lastName
            label: Last Name
          - value:
              - prop: email
            label: Email Address
          - value:
              - prop: description
            label: Description
```

This page loads data of a single person using the `resource.get` action. The person is then
displayed in the `detail-viewer` block, which looks a very similar to the `table` and `form` blocks.

What is new, is the `parameters` property. Also, when viewing the side menu, the person isn’t there.
The `id` parameter refers to a parameter in the URL of the page. The `id` is used to determine which
person data to load. Since the page can’t work without the context of the `id` value, there is no
good way to link it from the side menu.

To use this page, it must be linked from a place where the context is known. This is where the
_“Register”_ page comes in. The `table` block has an optional `onClick` action. This action passes
along context of a single entity.

Now, when a list item is clicked, the user will be redirected to the person’s detail page.

At this point, the app definition should look like this:

```yaml copy filename="app-definition.yaml"
name: My App
description: ''
defaultPage: People

resources:
  person:
    schema:
      type: object
      required:
        - firstName
        - lastName
        - email
      properties:
        firstName:
          type: string
          maxLength: 80
        lastName:
          type: string
          maxLength: 80
        email:
          type: string
          format: email
        description:
          type: string
          maxLength: 500

pages:
  - name: Register
    blocks:
      - type: form
        version: 0.19.8
        parameters:
          fields:
            - name: firstName
              label: First Name
            - name: lastName
              label: Surname
            - name: email
              label: Email Address
              format: email
            - name: description
              label: Description
              multiline: true

  - name: People
    blocks:
      - type: data-loader
        version: 0.19.8
        actions:
          onLoad:
            type: resource.query
            resource: person
        events:
          emit:
            data: people
      - type: table
        version: 0.19.8
        events:
          listen:
            data: people
        parameters:
          fields:
            - value:
                - prop: firstName
              label: First Name
            - value:
                - prop: lastName
              label: Surname

  - name: Person details
    parameters:
      - id
    blocks:
      - type: data-loader
        version: 0.19.8
        actions:
          onLoad:
            type: resource.get
            resource: person
        events:
          emit:
            data: person
      - type: detail-viewer
        version: 0.19.8
        events:
          listen:
            data: person
        parameters:
          fields:
            - value:
                - prop: firstName
              label: First Name
            - value:
                - prop: lastName
              label: Last Name
            - value:
                - prop: email
              label: Email Address
            - value:
                - prop: description
              label: Description
```

## Further reading

If you got to this point, you have seen the basics of creating apps using Appsemble. However, more
complex apps require more features than creating and viewing resources. The following guides
continue on the result of the app created in this guide:

- [Resources](resources.md)
- [Security](security.md)
- [Notifications](notifications.md)
- [Theming](theming.md)
- [DNS](dns.md)
- [Reference documentation](/docs/reference)
