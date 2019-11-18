export default {
  name: 'Person App',
  description:
    'Person App is an application that starts out with a simple person registration form using the resource API as well as pages to display this data.',
  definition: {
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
            version: '0.9.3',
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
              onClick: {
                to: 'Person Details',
                type: 'link',
              },
              onLoad: {
                type: 'resource.query',
                resource: 'person',
              },
            },
          },
          {
            type: 'action-button',
            version: '0.9.3',
            parameters: {
              icon: 'plus',
            },
            actions: {
              onClick: {
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
            version: '0.9.3',
            actions: {
              onSubmit: {
                type: 'resource.create',
                resource: 'person',
              },
              onSubmitSuccess: {
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
            version: '0.9.3',
            actions: {
              onLoad: {
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
  // These people were generated using Faker.js, any resemblance to reality is purely coincidental.
  // https://github.com/marak/Faker.js/
  resources: {
    person: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        description: `John Doe

Example extraordinaire!`,
      },
      {
        firstName: 'Walter',
        lastName: 'Gutmann',
        email: 'walter@example.com',
        description: `Walter Gutmann: Cassin Group LLC

Position: Lead Mobility Orchestrator`,
      },
      {
        firstName: 'Elta',
        lastName: 'Feil',
        email: 'elta@example.com',
        description: 'Senior Tactics Director',
      },
      {
        firstName: 'Robbie',
        lastName: 'Heller',
        email: 'robbie@example.com',
        description: 'Human Communications Engineer',
      },
      {
        firstName: 'Leanna',
        lastName: 'McClure',
        email: 'leanna@example.com',
        description: 'Try to parse the SQL application, maybe it will index the mobile program!',
      },
      {
        firstName: 'Rudolph',
        lastName: 'Thompson',
        email: 'rudolph@example.com',
        description: "You can't quantify the alarm without navigating the bluetooth AI interface!",
      },
      {
        firstName: 'Sigrid',
        lastName: 'Cole',
        email: 'sigrid@example.com',
        description:
          'If we index the firewall, we can get to the COM panel through the cross-platform CSS matrix!',
      },
      {
        firstName: 'Ara',
        lastName: 'Hill',
        email: 'ara@example.com',
        description:
          'The EXE driver is down, input the cross-platform monitor so we can synthesize the CSS port!',
      },
      {
        firstName: 'Georgiana',
        lastName: 'Armstrong',
        email: 'georgiana@example.com',
        description:
          'Repudiandae ducimus sed temporibus necessitatibus voluptas sed sunt quo exercitationem. Necessitatibus ut et maiores id culpa quia. Sit dolor atque itaque.',
      },
    ],
  },
};
