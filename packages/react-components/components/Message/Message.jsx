import { Message as BulmaMessage, MessageBody } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import styles from './Message.css';

export default class Message extends React.Component {
  static propTypes = {
    messages: PropTypes.arrayOf(PropTypes.shape()),
    remove: PropTypes.func.isRequired,
  };

  static defaultProps = {
    messages: [],
  };

  componentDidUpdate(prevProps) {
    const { messages, remove } = this.props;

    if (messages.length > prevProps.messages.length) {
      const message = messages[messages.length - 1];

      setTimeout(() => {
        remove(message);
      }, 5e3);
    }
  }

  render() {
    const { messages } = this.props;

    return (
      <ul className={styles.root}>
        <ReactCSSTransitionGroup
          transitionEnterTimeout={300}
          transitionLeaveTimeout={300}
          transitionName={{
            enter: styles.messageEnter,
            enterActive: styles.messageEnterActive,
            leave: styles.messageLeave,
            leaveActive: styles.messageLeaveActive,
          }}
        >
          {messages.map(message => (
            <BulmaMessage key={message.id} color={(message && message.color) || 'danger'}>
              <MessageBody className={styles.content}>{message?.body}</MessageBody>
            </BulmaMessage>
          ))}
        </ReactCSSTransitionGroup>
      </ul>
    );
  }
}
