import 'bulma/css/bulma.css';
import {
  bootstrap,
} from '@appsemble/react';
import {
  provideIntl,
} from '@appsemble/react/intl';

import FormBlock from './components/FormBlock';


bootstrap(provideIntl(FormBlock));
