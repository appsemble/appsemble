import {
  Card,
  CardContent,
  CardFooter,
  CardFooterItem,
  CardHeader,
  CardHeaderTitle,
  Container,
  Modal,
  SelectField,
  InputField,
  Button,
} from '@appsemble/react-bulma';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import styles from './createappcard.css';
import templates from '../../../../templates';
import { push } from '../../../../../app/actions/message';

export default class CreateAppCard extends React.Component {
  state = {
    modalOpen: false,
    selectedTemplate: 0,
    appName: '',
  };

  onClick = async () => {
    this.setState({ modalOpen: true });
  };

  onClose = async () => {
    this.setState({ modalOpen: false });
  };

  onCreate = async event => {
    event.preventDefault();

    const { createApp, history } = this.props;
    const { appName, selectedTemplate } = this.state;

    try {
      const template = templates[selectedTemplate].recipe;
      const app = await createApp({ ...template, name: appName });

      history.push(`/editor/${app.id}`);
    } catch (e) {
      if (e.response && e.response.status === 409) {
        // XXX implement i18n
        push({ body: `An app with the name "${appName}" already exists.` });
      } else {
        // XXX implement i18n
        push({ body: 'Something went wrong when creating this app.' });
      }
    }
  };

  render() {
    const { modalOpen, selectedTemplate, appName } = this.state;
    return (
      <div className={styles.createAppCardContainer}>
        <Card className={styles.createAppCard} onClick={this.onClick}>
          <CardContent>
            <span>
              <FormattedMessage {...messages.createApp} />
            </span>
          </CardContent>
        </Card>
        <Container component="form" onSubmit={this.onCreate}>
          <Modal active={modalOpen} onClose={this.onClose}>
            <Card>
              <CardHeader>
                <CardHeaderTitle>
                  <FormattedMessage {...messages.createAppTitle} />
                </CardHeaderTitle>
              </CardHeader>
              <CardContent>
                <InputField
                  label="Name" // XXX implement i18n
                  name="name"
                  onChange={e => this.setState({ appName: e.target.value })}
                  placeholder="Name" // XXX implement i18n
                  required
                  value={appName}
                />
                <SelectField
                  label="Template" // XXX implement i18n
                  name="template"
                  onChange={e => {
                    this.setState({ selectedTemplate: e.target.value });
                  }}
                  value={selectedTemplate}
                >
                  {templates.map((template, index) => (
                    <option key={template.name} value={index}>
                      {template.name}
                    </option>
                  ))}
                </SelectField>
              </CardContent>
              <CardFooter>
                <CardFooterItem className="is-link" component="a" onClick={this.onClose}>
                  <FormattedMessage {...messages.cancel} />
                </CardFooterItem>
                <CardFooterItem>
                  <Button className="is-link" type="submit">
                    <FormattedMessage {...messages.create} />
                  </Button>
                </CardFooterItem>
              </CardFooter>
            </Card>
          </Modal>
        </Container>
      </div>
    );
  }
}
