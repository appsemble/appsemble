import { withBlock } from '@appsemble/react';
import { injectIntl } from 'react-intl';

import Card, { CardProps } from './Card';

export default withBlock<CardProps>(injectIntl(Card));
