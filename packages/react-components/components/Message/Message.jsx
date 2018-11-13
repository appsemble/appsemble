import { Message as BulmaMessage, MessageBody } from '@appsemble/react-bulma';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './Message.css';

export default class Message extends React.Component {
  static propTypes = {
    message: PropTypes.shape(),
    shift: PropTypes.func.isRequired,
  };

  static defaultProps = {
    message: null,
  };

  componentDidUpdate(prevProps) {
    const { message, shift } = this.props;

    if (message !== prevProps.message) {
      setTimeout(shift, 5e3);
    }
  }

  render() {
    const { message } = this.props;

    return (
      <BulmaMessage
        className={classNames(styles.root, { [styles.hidden]: !message })}
        color={(message && message.color) || 'danger'}
      >
        <MessageBody className={styles.content}>{message?.body}</MessageBody>
      </BulmaMessage>
    );
  }
}
