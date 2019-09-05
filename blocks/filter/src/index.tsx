import { bootstrap } from '@appsemble/preact';

import FilterBlock from './components/FilterBlock';

const messages = {
  from: 'From',
  to: 'To',
  cancel: 'Cancel',
  filter: 'Filter',
  refreshData: `Show {amount} new {amount, plural,
    one {item}
    other {items}
  }`,
};

bootstrap(FilterBlock, messages);
