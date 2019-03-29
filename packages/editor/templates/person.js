export default {
  name: 'Person App',
  description:
    'Person App is an application that starts out with a simple person registration form using the resource API as well as pages to display this data.',
  recipe: {
    name: 'Person App',
    defaultPage: 'Person Registration Form',
    resources: {
      person: {
        schema: {
          type: 'object',
          required: ['firstName', 'lastName', 'email'],
          properties: {
            firstName: {
              type: 'string',
            },
            lastName: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            description: {
              type: 'string',
            },
          },
        },
      },
    },
    pages: [
      {
        name: 'Person List',
        blocks: [
          {
            type: 'list',
            version: '1.0.0',
            parameters: {
              fields: [
                {
                  name: 'firstName',
                  label: 'First Name',
                },
                {
                  name: 'lastName',
                  label: 'Surname',
                },
              ],
            },
            actions: {
              click: {
                to: 'Person Details',
                type: 'link',
              },
              load: {
                type: 'resource.query',
                resource: 'person',
              },
            },
          },
          {
            type: 'action-button',
            version: '1.0.0',
            actions: {
              click: {
                to: 'Person Registration Form',
                type: 'link',
              },
            },
          },
        ],
      },
      {
        name: 'Person Registration Form',
        blocks: [
          {
            type: 'form',
            version: '1.0.0',
            actions: {
              submit: {
                type: 'resource.create',
                resource: 'person',
              },
              submitSuccess: {
                to: 'Person List',
                type: 'link',
              },
            },
            parameters: {
              fields: [
                {
                  label: 'First Name',
                  name: 'firstName',
                  type: 'string',
                },
                {
                  label: 'Surname',
                  name: 'lastName',
                  type: 'string',
                },
                {
                  label: 'Email',
                  name: 'email',
                  type: 'string',
                },
                {
                  label: 'Description',
                  multiline: true,
                  name: 'description',
                  type: 'string',
                },
              ],
            },
          },
        ],
      },
      {
        name: 'Person Details',
        parameters: ['id'],
        blocks: [
          {
            type: 'detail-viewer',
            version: '1.0.0',
            actions: {
              load: {
                type: 'resource.get',
                resource: 'person',
              },
            },
            parameters: {
              fields: [
                {
                  name: 'firstName',
                  label: 'First Name',
                },
                {
                  name: 'lastName',
                  label: 'Surname',
                },
                {
                  name: 'email',
                  label: 'Email Address',
                },
                {
                  name: 'description',
                  label: 'Description',
                },
              ],
            },
          },
        ],
      },
    ],
  },
};
