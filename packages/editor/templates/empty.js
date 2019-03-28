export default {
  name: 'Empty App',
  recipe: {
    name: 'Empty App',
    defaultPage: 'Example Page A',
    theme: {
      themeColor: '#000000',
    },
    pages: [
      {
        name: 'Example Page A',
        blocks: [
          {
            type: 'action-button',
            version: '1.0.0',
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
            version: '1.0.0',
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
