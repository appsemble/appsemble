import { injectIntl } from 'react-intl';

import Message, { MessageProps, UniqueMessage } from './Message';

export { UniqueMessage };
export default injectIntl<'intl', MessageProps>(Message);
