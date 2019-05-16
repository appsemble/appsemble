import { bootstrap } from '@appsemble/react';
import { provideIntl } from '@appsemble/react/intl';

import ListBlock from './components/ListBlock';

bootstrap(provideIntl(ListBlock));
