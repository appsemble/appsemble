import { bootstrap } from '@appsemble/react';
import { provideIntl } from '@appsemble/react/intl';

import FilterBlock from './components/FilterBlock';

bootstrap(provideIntl(FilterBlock));
