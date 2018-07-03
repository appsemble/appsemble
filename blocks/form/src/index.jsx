import {
  bootstrap,
} from '../../../sdk';
import {
  provideIntl,
} from '../../../sdk/intl';
import {
  provideMui,
} from '../../../sdk/mui';
import {
  mount,
} from '../../../sdk/react';

import FormBlock from './components/FormBlock';


bootstrap(mount(provideIntl(provideMui(FormBlock))));
