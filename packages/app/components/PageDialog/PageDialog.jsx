import { Modal } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import BlockList from '../BlockList';
import styles from './PageDialog.css';

/**
 * The dialog component to render on a page when the `dialog` action is dispatched.
 */
export default class PageDialog extends React.Component {
  static propTypes = {
    /**
     * The dialog definition to render.
     */
    dialog: PropTypes.shape(),
    getBlockDefs: PropTypes.func.isRequired,
  };

  static defaultProps = {
    dialog: null,
  };

  componentDidMount() {
    const { dialog, getBlockDefs } = this.props;

    if (dialog) {
      getBlockDefs(dialog.blocks);
    }
  }

  componentDidUpdate() {
    const { dialog, getBlockDefs } = this.props;

    if (dialog) {
      getBlockDefs(dialog.blocks);
    }
  }

  render() {
    const { dialog, ...props } = this.props;

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
  }
}
