import { BlockProps, bootstrap } from '@appsemble/preact';
import { ComponentType } from 'preact';

import { BlockActions, BlockParameters, Events } from '../block';
import FeedBlock from './components/FeedBlock';
import styles from './index.css';

const messages = {
  anonymous: 'Anonymous',
  empty: 'No data to display',
  reply: 'Leave a message…',
  replyError: 'Something went wrong trying to send this message.',
};

bootstrap(
  FeedBlock as ComponentType<BlockProps<BlockParameters, BlockActions, Events>>,
  messages,
  () => Object.assign(document.createElement('div'), { className: styles.reactRoot }),
);
