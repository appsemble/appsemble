import {
  bootstrap,
} from '@appsemble/react';
import {
  provideIntl,
} from '@appsemble/react/intl';
import {
  provideMui,
} from '@appsemble/react/mui';

import DetailViewerBlock from './components/DetailViewerBlock';


bootstrap(provideIntl(provideMui(DetailViewerBlock)));
