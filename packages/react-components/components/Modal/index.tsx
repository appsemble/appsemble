import { injectIntl, WrappedComponentProps } from 'react-intl';

import Modal, { ModalProps } from './Modal';

export default injectIntl<'intl', WrappedComponentProps & ModalProps>(Modal);
