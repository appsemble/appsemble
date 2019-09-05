import { bootstrap } from '@appsemble/preact';

import ListBlock from './components/ListBlock';

const messages = {
  error: 'An error occurred when fetching the data.',
  noData: 'No data.',
};

bootstrap(ListBlock, messages);
