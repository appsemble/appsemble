import { Modal } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import BlockList from '../BlockList';
import styles from './PageDialog.css';

/**
 * The dialog component to render on a page when the `dialog` action is dispatched.
 */
const PageDialog = ({ dialog = null, getBlockDefs, ...props }) => {
  useEffect(() => {
    if (dialog) {
      getBlockDefs(dialog.blocks);
    }
  });

  return (
    <Modal isActive={!!dialog} onClose={dialog && dialog.close}>
      {dialog && (
        <div className={classNames('card', { [styles.fullscreen]: dialog.fullscreen })}>
          <BlockList
            actionCreators={dialog.actionCreators}
            blocks={dialog.blocks}
            data={dialog.data}
            {...props}
          />
        </div>
      )}
    </Modal>
  );
};

PageDialog.propTypes = {
  dialog: PropTypes.shape(),
  getBlockDefs: PropTypes.func.isRequired,
};

PageDialog.defaultProps = {
  dialog: null,
};

export default PageDialog;
