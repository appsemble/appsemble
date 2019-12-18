import { injectIntl, WrappedComponentProps } from 'react-intl';

import Modal from './Modal';

export default injectIntl<
  'intl',
  WrappedComponentProps & React.ComponentPropsWithoutRef<typeof Modal>
>(Modal);
