import 'bulma/css/bulma.css';
import {
  bootstrap,
} from '@appsemble/react';
import {
  provideIntl,
} from '@appsemble/react/intl';
import {
  provideMui,
} from '@appsemble/react/mui';

import FormBlock from './components/FormBlock';


bootstrap(provideIntl(provideMui(FormBlock)));
