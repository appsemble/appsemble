import {
  Card,
  CardContent,
  CardFooter,
  CardFooterItem,
  CardHeader,
  CardHeaderTitle,
  Container,
  InputField,
  Modal,
  SelectField,
} from '@appsemble/react-bulma';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import styles from './CreateAppCard.css';
import templates from '../../../../templates';

export default class CreateAppCard extends React.Component {
  state = {
    modalOpen: false,
    selectedTemplate: 0,
    selectedOrganization: 0,
    appName: '',
  };

  onChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  onClick = async () => {
    this.setState({ modalOpen: true });
  };

  onClose = async () => {
    this.setState({ modalOpen: false });
  };

  onCreate = async event => {
    event.preventDefault();

    const {
      createApp,
      history,
      push,
      intl: { formatMessage },
      user,
    } = this.props;
    const { appName, selectedTemplate, selectedOrganization } = this.state;

    try {
      const template = templates[selectedTemplate].recipe;
      const app = await createApp(
        { ...template, name: appName },
        user.organizations[selectedOrganization],
      );

      history.push(`/_/edit/${app.id}`);
    } catch (e) {
      if (e.response) {
        if (e.response.status === 409) {
          push({ body: formatMessage(messages.nameConflict, { name: appName }) });
        }

        if (e.response.data.message === 'Unknown blocks or block versions found') {
          const blocks = Array.from(new Set(Object.values(e.response.data.data)));

          push({
            body: formatMessage(messages.missingBlocks, { blockCount: blocks.length, blocks }),
          });
        }
      } else {
        push({ body: formatMessage(messages.error) });
      }
    }
  };

  render() {
    const {
      intl: { formatMessage },
      user,
    } = this.props;
    const { modalOpen, selectedTemplate, selectedOrganization, appName } = this.state;
    return (
      <div className={styles.createAppCardContainer}>
        <Card className={styles.createAppCard} onClick={this.onClick}>
          <CardContent>
            <FormattedMessage {...messages.createApp} />
          </CardContent>
        </Card>
        <Container component="form" onSubmit={this.onCreate}>
          <Modal active={modalOpen} ModalCloseProps={{ size: 'large' }} onClose={this.onClose}>
            <Card>
              <CardHeader>
                <CardHeaderTitle>
                  <FormattedMessage {...messages.createAppTitle} />
                </CardHeaderTitle>
              </CardHeader>
              <CardContent>
                <InputField
                  label={formatMessage(messages.name)}
                  maxLength={30}
                  minLength={1}
                  name="appName"
                  onChange={this.onChange}
                  placeholder={formatMessage(messages.name)}
                  required
                  value={appName}
                />
                <SelectField
                  disabled={user.organizations.length === 1}
                  label={formatMessage(messages.organization)}
                  name="selectedOrganization"
                  onChange={this.onChange}
                  value={selectedOrganization}
                >
                  {user.organizations.map((organization, index) => (
                    <option key={organization.id} value={index}>
                      {organization.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField
                  label={formatMessage(messages.template)}
                  name="selectedTemplate"
                  onChange={this.onChange}
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
                <CardFooterItem
                  className={styles.cardFooterButton}
                  component="button"
                  type="submit"
                >
                  <FormattedMessage {...messages.create} />
                </CardFooterItem>
              </CardFooter>
            </Card>
          </Modal>
        </Container>
      </div>
    );
  }
}
