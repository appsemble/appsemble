import { bootstrap } from '@appsemble/react';
import { provideIntl } from '@appsemble/react/intl';

import FeedBlock from './components/FeedBlock';
import styles from './index.css';

const reactRoot = document.createElement('div');
reactRoot.classList.add(styles.reactRoot);

bootstrap(provideIntl(FeedBlock), reactRoot);
