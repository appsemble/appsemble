export default {
  name: 'Unlittered App',
  description:
    'An app featuring a form in which litter can be reported and displayed on an interactive map.',
  recipe: {
    name: 'Unlittered',
    defaultPage: 'Report litter',
    theme: {
      themeColor: '#eb0000',
      splashColor: '#ffffff',
      primaryColor: '#eb0000',
    },
    resources: {
      litter: {
        schema: {
          type: 'object',
          required: ['notes', 'process'],
          properties: {
            notes: {
              type: 'string',
              title: 'Notes',
            },
            photos: {
              type: 'array',
              items: {
                type: 'string',
                appsembleFile: {
                  type: ['image/jpeg'],
                },
              },
              title: 'Photos',
            },
            process: {
              enum: ['Bicycle Collection', 'Maintenance', 'Biodegradable Waste', 'Collection'],
              title: 'Process',
            },
            location: {
              type: 'object',
              title: 'GeoCoordinates',
              required: ['latitude', 'longitude'],
              properties: {
                latitude: {
                  type: 'number',
                },
                longitude: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
    },
    pages: [
      {
        name: 'Report litter',
        blocks: [
          {
            type: 'form',
            version: '0.5.0',
            parameters: {
              fields: [
                {
                  name: 'location',
                  type: 'geocoordinates',
                  label: 'Location',
                },
                {
                  enum: [
                    {
                      value: 'Bicycle Collection',
                    },
                    {
                      value: 'Maintenance',
                    },
                    {
                      value: 'Biodegradable Waste',
                    },
                    {
                      value: 'Collection',
                    },
                  ],
                  name: 'process',
                  label: 'Process',
                },
                {
                  name: 'notes',
                  type: 'string',
                  label: 'Notes',
                  multiline: true,
                  placeholder: 'Example: There is a bicycle in the bushes',
                },
                {
                  name: 'photos',
                  type: 'file',
                  label: 'Photos',
                  accept: ['image/jpeg'],
                  repeated: true,
                },
              ],
            },
            actions: {
              submit: {
                type: 'resource.create',
                resource: 'litter',
              },
              submitSuccess: {
                type: 'link',
                to: 'Litter Overview',
              },
            },
          },
        ],
      },
      {
        name: 'Litter Overview',
        blocks: [
          {
            type: 'map',
            version: '0.5.0',
            parameters: {
              latitude: 'location.latitude',
              longitude: 'location.longitude',
            },
            actions: {
              markerClick: {
                to: 'Litter details',
                type: 'link',
              },
              load: {
                type: 'resource.query',
                resource: 'litter',
                query: {
                  $orderBy: 'created desc',
                  $top: 50,
                },
              },
            },
          },
          {
            type: 'action-button',
            version: '0.5.0',
            actions: {
              click: {
                to: 'Report litter',
                type: 'link',
              },
            },
          },
        ],
      },
      {
        name: 'Litter details',
        parameters: ['id'],
        blocks: [
          {
            type: 'detail-viewer',
            version: '0.5.0',
            parameters: {
              fileBase: '/api/assets',
              fields: [
                {
                  name: 'location',
                  type: 'geocoordinates',
                  label: 'Location',
                  latitude: 'latitude',
                  longitude: 'longitude',
                },
                {
                  name: 'process',
                  label: 'Process',
                },
                {
                  name: 'notes',
                  label: 'Notes',
                },
                {
                  name: 'photos',
                  type: 'file',
                  label: 'Photos',
                  repeated: true,
                },
              ],
            },
            actions: {
              load: {
                type: 'resource.get',
                resource: 'litter',
              },
            },
          },
        ],
      },
    ],
  },
};
