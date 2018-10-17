import 'bulma/css/bulma.css';
import './amsterdam.css';
import { bootstrap } from '@appsemble/react';
import { provideIntl } from '@appsemble/react/intl';

import FormBlock from './components/FormBlock';

// XXX This is only for Amsterdam
const messages = {
  'blocks.form.components.FormBlock.submit': 'Verstuur',
};

bootstrap(provideIntl(FormBlock, { messages }));
