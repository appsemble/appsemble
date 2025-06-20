# App setup

In this training you will combine the knowledge you gained in the previous chapters and apply them
to create a basic app. As a good basic app, we will guide you through creating your own bicycle
store.

To start off, first create your app by going to the [App store](/apps) and clicking 'Create new
App'. Choose a nice name for your bicycle store, fill in the required information and click 'Create'

> **Note:** For this app we recommend using the 'Empty' template

## Pages

**Inventory**

Managers are able to see the inventory of bicycles. They can add new bicycles to the inventory so
they can be sold later.

**Sell bicycle**

Employees will be able to see a selection of bicycles. They can sell these bicycles to customers by
noting down their information. Once the bike is sold, it's number is subtracted from the total
bicycle count.

**Sale history**

Managers and employees can see a history of all bicycle sales.

## Resources

**bicycles**

As a bicycle store we need a way to track what bicycles are in the inventory. We can do this by
creating a resource where each bicycle gets added as an individual entry. To keep track of what
bikes we have, how many there are and what they look like, we can use the following properties:

- `type`: The type of bicycle to store.
- `stock`: How many bicycles of this type are in the inventory.
- `image`: An image of what the bicycle looks like to help employees identify the bike.

Your `bicycle` resource should look like this:

```yaml copy
bicycles:
  schema:
    type: object
    additionalProperties: false # Prevents other properties from being sent to the API
    required: # All these fields are required to have a value
      - type
      - stock
      - image
    properties:
      type:
        type: string
        maxLength: 50 # Setting a maximum length prevents unrealistic names from being added
      stock:
        type: integer
      image:
        type: string
        format: binary # This tells the system you can add a file
```

**saleHistory**

We also want a record of all sales that happened for administration purposes. The following
properties should help keep an organized and well-informed sales history:

- `bicycle`: The type of bicycle that was sold.
- `saleDate`: When the bicycle was sold.
- `buyerPhoneNumber`: Contact information of the buyer in case they need to be contacted again.
- `notes`: Additional notes that might be helpful to keep track of.

Your `saleHistory` resource should look like this:

```yaml copy
saleHistory:
  schema:
    type: object
    additionalProperties: false
    required:
      - bicycle
      - saleDate
      - buyerPhoneNumber
    properties:
      bicycle:
        type: string
        maxLength: 50
      saleDate:
        type: string
        format: date-time # Stores the value as a JavaScript Date object
      buyerPhoneNumber:
        type: integer
      notes:
        type: string
```

The final resource definition looks like this:

```yaml copy validate resources-snippet
resources:
  bicycles:
    schema:
      type: object
      additionalProperties: false
      required:
        - type
        - stock
        - image
      properties:
        type:
          type: string
          maxLength: 50
        stock:
          type: integer
        image:
          type: string
          format: binary
  saleHistory:
    schema:
      type: object
      additionalProperties: false
      required:
        - bicycle
        - saleDate
        - buyerPhoneNumber
      properties:
        bicycle:
          type: string
          maxLength: 50
        saleDate:
          type: string
          format: date-time
        buyerPhoneNumber:
          type: integer
        notes:
          type: string
```

## Security

As stated at the start we'll have two types of users: **employees** and **managers**. Employees sell
bicycles while managers manage the store's inventory.

While you could already define what permissions each role has, this is difficult to fully plan out
ahead of time. Instead, you can leave this empty and add permissions once you need them.

> **Tip**: Typing out clear descriptions helps you and other maintaineres understand what each role
> is responsible for.

Your security definition should look like this:

```yaml copy validate security-snippet
security:
  default:
    role: employee
  roles:
    employee:
      description: Regular employees of the store. They can sell bicycles.
    manager:
      description:
        Managers of the store. They are in charge of overseeing the store and can add/remove
        bicycles to the inventory. They can also manage stock of an individual bike.
      inherits:
        - employee # Managers should be able to do anything a regular employee can do
```

## Theme

It's good to choose a nice color palette that makes your app stand out from the rest while keeping
semantics. You could leave this blank to use the default Appsemble theme, or create your own.

For this app we're using the following theme:

```yaml copy
theme:
  primaryColor: '#4357AD'
  successColor: '#48A9A6'
  dangerColor: '#C1666B'
  warningColor: '#D4B483'
  infoColor: '#E4DFDA'
```

## Next steps

Now that the base parts of the app are set up, we can start creating the pages that will define the
functionality of the store.
