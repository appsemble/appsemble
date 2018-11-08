import { Card, CardContent, Modal, CardHeader, CardHeaderTitle } from '@appsemble/react-bulma';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import styles from './createappcard.css';

export default class CreateAppCard extends React.Component {
  state = {
    modalOpen: false,
  };

  onClick = async () => {
    this.setState({ modalOpen: true });
  };

  onClose = async () => {
    this.setState({ modalOpen: false });
  };

  render() {
    const { modalOpen } = this.state;
    return (
      <div>
        <Card className={styles.createAppCard} onClick={this.onClick}>
          <CardContent>
            <span>
              <FormattedMessage {...messages.createApp} />
            </span>
          </CardContent>
        </Card>
        <Modal active={modalOpen} onClose={this.onClose}>
          <Card>
            <CardHeader>
              <CardHeaderTitle>
                <span>Create a new app</span>
              </CardHeaderTitle>
            </CardHeader>
            <CardContent>
              <span>
                <FormattedMessage {...messages.createApp} />
              </span>
            </CardContent>
          </Card>
        </Modal>
      </div>
    );
  }
}
