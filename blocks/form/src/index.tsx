import { bootstrap } from '@appsemble/preact';

import FormBlock from './components/FormBlock';

const messages = {
  invalid: 'This value is invalid',
  emptyFileLabel: ' ',
  submit: 'Submit',
  unsupported: 'This file type is not supported',
};

bootstrap(FormBlock, messages);
