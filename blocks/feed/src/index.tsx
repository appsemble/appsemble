import { bootstrap } from '@appsemble/preact';

import FeedBlock from './components/FeedBlock';
import styles from './index.css';

const messages = {
  anonymous: 'Anonymous',
  empty: 'No data to display',
  reply: 'Leave a message…',
  replyError: 'Something went wrong trying to send this message.',
};

bootstrap(FeedBlock, messages, () =>
  Object.assign(document.createElement('div'), { className: styles.reactRoot }),
);
