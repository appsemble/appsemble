import { bootstrap } from '@appsemble/react';
import { provideIntl } from '@appsemble/react/intl';

import TodoListBlock from './components/TodoListBlock';

bootstrap(provideIntl(TodoListBlock));
