import { injectIntl } from 'react-intl';

import Message, { MessageProps } from './Message';

export default injectIntl<'intl', MessageProps>(Message);
