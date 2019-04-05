export default {
  summary: 'Minimal example app',

  value: {
    name: 'Example Application',
    defaultPage: 'Example Page A',
    theme: {
      themeColor: '#eb0000',
    },
    pages: [
      {
        name: 'Example Page A',
        blocks: [
          {
            type: 'action-button',
            actions: {
              click: {
                type: 'link',
                to: 'Example Page B',
              },
            },
          },
        ],
      },
      {
        name: 'Example Page B',
        blocks: [
          {
            type: 'action-button',
            actions: {
              click: {
                type: 'link',
                to: 'Example Page A',
              },
            },
          },
        ],
      },
    ],
  },
};
