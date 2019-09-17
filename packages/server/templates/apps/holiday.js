export default {
  name: 'Holiday App',
  description: 'A simple app that fetches holiday information for various countries',
  definition: {
    name: 'Holidays',
    defaultPage: 'Holidays in NL',
    pages: [
      {
        name: 'Holidays in NL',
        blocks: [
          {
            type: 'list',
            actions: {
              onLoad: {
                url:
                  'https://cors-anywhere.herokuapp.com/https://date.nager.at/Api/v2/NextPublicHolidays/NL',
                type: 'request',
              },
            },
            version: '0.8.7',
            parameters: {
              fields: [
                {
                  name: 'date',
                  label: 'Date',
                },
                {
                  name: 'name',
                  label: 'Name (EN)',
                },
                {
                  name: 'localName',
                  label: 'Name (NL)',
                },
              ],
            },
          },
        ],
      },
      {
        name: 'Holidays in US',
        blocks: [
          {
            type: 'list',
            actions: {
              onLoad: {
                url:
                  'https://cors-anywhere.herokuapp.com/https://date.nager.at/Api/v2/NextPublicHolidays/US',
                type: 'request',
              },
            },
            version: '0.8.7',
            parameters: {
              fields: [
                {
                  name: 'date',
                  label: 'Date',
                },
                {
                  name: 'name',
                  label: 'Name (EN)',
                },
              ],
            },
          },
        ],
      },
      {
        name: 'Holidays in DE',
        blocks: [
          {
            type: 'list',
            actions: {
              onLoad: {
                url:
                  'https://cors-anywhere.herokuapp.com/https://date.nager.at/Api/v2/NextPublicHolidays/DE',
                type: 'request',
              },
            },
            version: '0.8.7',
            parameters: {
              fields: [
                {
                  name: 'date',
                  label: 'Date',
                },
                {
                  name: 'name',
                  label: 'Name (EN)',
                },
                {
                  name: 'localName',
                  label: 'Name (DE)',
                },
              ],
            },
          },
        ],
      },
      {
        name: 'Holidays in ES',
        blocks: [
          {
            type: 'list',
            actions: {
              onLoad: {
                url:
                  'https://cors-anywhere.herokuapp.com/https://date.nager.at/Api/v2/NextPublicHolidays/ES',
                type: 'request',
              },
            },
            version: '0.8.7',
            parameters: {
              fields: [
                {
                  name: 'date',
                  label: 'Date',
                },
                {
                  name: 'name',
                  label: 'Name (EN)',
                },
                {
                  name: 'localName',
                  label: 'Name (ES)',
                },
              ],
            },
          },
        ],
      },
    ],
  },
};
