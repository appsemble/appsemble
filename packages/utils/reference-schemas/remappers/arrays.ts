import { type OpenAPIV3 } from 'openapi-types';

export const arrayRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  'array.map': {
    $ref: '#/components/schemas/RemapperDefinition',
    description: `
The remapper goes through the given array and applies the given remappers on each individual item.
This can be very handy when sorting arrays by certain data. The remapper always returns an array.
Output can be an empty array if the supplied data isn’t an array.

For example, if you want to sort through a list of people and only get their occupations you can do
the following:

Input:

\`\`\`json
[
  {
    "name": "Peter",
    "occupation": "Delivery driver"
  },
  {
    "name": "Otto",
    "occupation": "Scientist"
  },
  {
    "name": "Harry",
    "occupation": "CEO"
  }
]
\`\`\`

\`\`\`yaml
array.map:
  object.omit:
    - name
\`\`\`

Result:

\`\`\`json
[{ "occupation": "Delivery driver" }, { "occupation": "Scientist" }, { "occupation": "CEO" }]
\`\`\`

Another great use for \`array.map\` is to combine it with the \`if\` remapper and sort your arrays on
specific values.

Using the same input data from the previous example, look at how you can change the code to get
people from a specific occupation:

\`\`\`yaml
- array.map:
    if:
      condition: { equals: [{ prop: occupation }, Scientist] }
      then:
        object.from:
          name:
            prop: name
          occupation:
            prop: occupation
      else: null
- null.strip: null
\`\`\`

Result:

\`\`\`json
[
  {
    "name": "Otto",
    "occupation": "Scientist"
  }
]
\`\`\`

Because \`array.map\` returns an array, every item has to return something. This is why we have to
return the full object with the data we want in the \`then\` section. It’s also why we return \`null\`.
This results in an array consisting of \`null\` values and objects with actual data in them. To solve
this problem, we use the \`null.strip\` remapper to remove any null values which results in a clean
array.
`,
  },
  'array.unique': {
    $ref: '#/components/schemas/RemapperDefinition',
    description: `
Filters out unique values from an array. The value Remapper is applied to each entry in the array
using its result to determine uniqueness.

If the value Remapper results in undefined or null, the entire entry is used for uniqueness.

If the input is not an array, the input is returned without any modifications.

Input:

\`\`\`json
[1, 1, 2, 3]
\`\`\`

\`\`\`yaml
array.unique: null
\`\`\`

Result:

\`\`\`json
[1, 2, 3]
\`\`\`

You can also check for more complex values in arrays. The remapper accepts remappers as well, so you
can also use entire objects to check for unique values.

For this example, we have the following extended data with some duplicate values:

\`\`\`json
[
  {
    "name": "Peter",
    "occupation": "Delivery driver",
    "age": 19
  },
  {
    "name": "Peter",
    "occupation": "Photographer",
    "age": 19
  },
  {
    "name": "Otto",
    "occupation": "Scientist",
    "age": 50
  },
  {
    "name": "Harry",
    "occupation": "CEO",
    "age": 20
  }
]
\`\`\`

We can be fairly sure in this list of people the first two Peters are the same person but with a
different occupation. To get more complex unique values from here, we can do the following:

\`\`\`yaml
array.unique:
  object.from:
    name: { prop: name }
    age: { prop: age }
\`\`\`

This then checks the array for unique values in both the \`name\` and \`age\` fields. The result of this
remapper is a filtered list:

\`\`\`json
[
  {
    "name": "Peter",
    "occupation": "Delivery driver",
    "age": 19
  },
  {
    "name": "Otto",
    "occupation": "Scientist",
    "age": 50
  },
  {
    "name": "Harry",
    "occupation": "CEO",
    "age": 20
  }
]
\`\`\`
    `,
  },
  'array.from': {
    type: 'array',
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `
Creates a new array based on a provided array of remappers. This array can also consist of static
values.

For example:

\`\`\`yaml
array.from:
  - Peter
  - Otto
  - Harry
\`\`\`

\`\`\`json
["Peter", "Otto", "Harry"]
\`\`\`

This remapper can also be used to convert given data into an array.

Input:

\`\`\`json
{
  "name": "Peter",
  "occupation": "Delivery driver"
}
\`\`\`

\`\`\`yaml
array.from:
  - root: null # Takes the data passed to this remapper, explained more in the 'Data' page
\`\`\`

Result:

\`\`\`json
[
  {
    "name": "Peter",
    "occupation": "Delivery driver"
  }
]
\`\`\`
    `,
  },
  'array.append': {
    type: 'array',
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `
Append new values to the end of an array. If the input is not an array an empty array is returned.

Using the array from the previous example, we can add a new object on top of it using this remapper:

\`\`\`yaml
array.append:
  - object.from:
      name: James
      occupation: News reporter
\`\`\`

Result:

\`\`\`json
[
  {
    "name": "Peter",
    "occupation": "Delivery driver"
  },
  {
    "name": "Otto",
    "occupation": "Scientist"
  },
  {
    "name": "Harry",
    "occupation": "CEO"
  },
  {
    "name": "James",
    "occupation": "News reporter"
  }
]
\`\`\`

Extra example:

array remapper can also be used in combination with different remappers as in the current example comes object remapper:

Example object:
\`\`\`json
{
  "names": ["Bart", "Bas", "Sam"]
}
\`\`\`

Combination of object and array remapper:

\`\`\`yaml
object.assign:
  names:
  - { prop: Applicants }
  - array.append:
    - Kevin
\`\`\`

Result:
\`\`\`json
{
  "names": ["Bart", "Bas", "Sam", "Kevin"]
}
\`\`\`
\
    `,
  },
  'array.omit': {
    type: 'array',
    items: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `
Remove values from an array. The input is expected to be the index(es) of the items to be deleted.
Accepts an array of static or remapper values.

With the previous example we added a new person to the list of people, so now we can remove that
person. We already know the index of this person in the array is \`3\`, so it’s easy:

\`\`\`yaml
array.omit:
  - 3
\`\`\`

Result:

\`\`\`json
[
  {
    "name": "Peter",
    "occupation": "Delivery driver"
  },
  {
    "name": "Otto",
    "occupation": "Scientist"
  },
  {
    "name": "Harry",
    "occupation": "CEO"
  }
]
\`\`\`

However, usually we don’t know the exact index of the item we want to delete. Because the remapper
accepts remappers as input we can get the desired item’s ID from another source as well. Take the
following example:

In this example we assume the data from the previous example is passed to this table block using a
data loader’s emitting event called “people”. When the user clicks on one of the people in the
table, it gets the list of people again. Using the index of this person, and the \`array.omit\`
remapper, the person gets removed from the list.

\`\`\`yaml
type: table
version: 0.20.38
events:
  listen:
    data: people
parameters:
  fields:
    - label: Name
      value: { prop: name }
      onClick: removePerson
    - label: Occupation
      value: { prop: occupation }
actions:
  removePerson:
    type: resource.query
    resource: citizensNYC
    remapAfter:
      array.omit:
        - context: index # This gets the index of the item in the table, explained more in the 'Data' page.
    onSuccess:
      type: resource.update
      resource: citizensNYC
\`\`\`
    `,
  },
};
