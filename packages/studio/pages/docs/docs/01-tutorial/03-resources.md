# Resources

Another frequently used part of creating an app is that you are able to create, read, update and
delete data (CRUD). In Appsemble you can configure your own resources. When you are starting out
with Appsemble there isn’t directly a need for external resources. It is possible to use external
resources in Appsemble. How you can do this is not part of this starters tutorial.

You can define your resource under the element resources. In the code below the resource person is
created. This resource contains: `firstName`, `lastName`, `email` and `description`. You could use
this resource for a participant overview for example.

```yaml validate resources-snippet
resources:
  person:
    roles: [$public]
    schema:
      type: object
      additionalProperties: false
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

If you look at this code one of the things you can see is that for storing the email address there
is an email format available. This format makes sure that the value you submit is of an email
address format. Typically `firstName` and `lastName` won’t contain as many characters as a
description so the length of those fields are restricted to 80 characters.

As soon as you define a source and save your file your resource will appear in the left menu item
under Resources:

![Resources Menu](../../tutorial-assets/resources-menu-person.png 'Resources Menu')

In this menu you can add records to your resource. If you click on the person link you will see a
new screen where you can update the person resource. We want to update the person resource in the
app. To do so you will need the following element:

- Resource
- Data-loader (a block that loads the existing data)
- Table (this will display the data)
- Form (here you can input new data)

All these elements need to be defined in the code. Next we shall explain the elements. If you only
need to show the data there is no need for the Form element.

**Data-loader**

Here you see the code of the data-loader block

```yaml validate block-snippet
- type: data-loader
  version: 0.23.2
  actions:
    onLoad:
      type: resource.query
      resource: person
  events:
    emit:
      data: people
```

The data-loader gets the data through the resource.query process. Then it emits all the data to a
new object named people. This is needed so that the data is locally accessible. For this rather
simple example this way of working seems a bit excessive. But once you have multiple and bigger
resources in place this way of working is more efficient and secure.

**table**

The following is the table block:

```yaml validate block-snippet
- type: table
  version: 0.23.2
  events:
    listen:
      data: people
  parameters:
    fields:
      - value: { prop: firstName }
        label: First name
      - value: { prop: lastName }
        label: Last name
```

The table element listens to the people event in order to get the correct data. In this example we
only show the `firstName` and the `lastName`. If you have 6 records in your resources. This table
will show you 6 rows with the 2 columns `firstname` and `lastname`.

If the resource is empty no data will be shown. We now continue with how to update the resource info
in the app via a form.

**form**

With a form block you can easily shape the page of your app. In this example we only use the form
block as an input form:

```yaml validate block-snippet
- type: form
  version: 0.23.2
  actions:
    onSubmit:
      type: resource.create
      resource: person
      onSuccess:
        type: link
        to: Home
  parameters:
    fields:
      - name: firstName
        type: string
        label: First Name
        requirements:
          - required: true
            errorMessage: This field is required
          - maxLength: 80
      - name: lastName
        type: string
        label: Surname
        requirements:
          - required: true
            errorMessage: This field is required
          - maxLength: 80
      - name: email
        type: string
        label: Email Address
        format: email
        requirements:
          - required: true
            errorMessage: This field is required
      - name: description
        type: string
        label: Description
        multiline: true
        requirements:
          - maxLength: 500
```

You can see the 4 fields being used which we also defined earlier in the resource person. Just like
in the resource the first 3 fields, firstName, `lastName` and email are required. Also the length of
the fields is defined. This all needs to match with the resource.

With resource.create this form block updates the person resource with the information that is being
provided in the form. `onSuccess` allows you to make a chain of actions, which in this case makes
sure that when the form is submitted successfully the user is redirected to the Home page.

- [Next: Tips and tricks](04-tips-and-tricks.md)
- [Previous: Blocks](02-blocks.md)
- [Back to tutorial index](index.md)
