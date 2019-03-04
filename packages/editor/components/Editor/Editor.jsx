import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardFooterItem,
  CardHeader,
  CardHeaderTitle,
  File,
  FileCta,
  FileIcon,
  FileInput,
  FileLabel,
  FileName,
  Icon,
  Image,
  Modal,
  Navbar,
  NavbarBrand,
  NavbarItem,
  Tab,
  TabItem,
} from '@appsemble/react-bulma';
import { Loader } from '@appsemble/react-components';
import axios from 'axios';
import isEqual from 'lodash.isequal';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import yaml from 'js-yaml';
import validate, { SchemaValidationError } from '@appsemble/utils/validate';
import validateStyle from '@appsemble/utils/validateStyle';

import MonacoEditor from './components/MonacoEditor';
import styles from './Editor.css';
import messages from './messages';

export default class Editor extends React.Component {
  static propTypes = {
    history: PropTypes.shape().isRequired,
    intl: PropTypes.shape().isRequired,
    location: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    push: PropTypes.func.isRequired,
  };

  state = {
    // eslint-disable-next-line react/no-unused-state
    appSchema: {},
    recipe: '',
    style: '',
    sharedStyle: '',
    initialRecipe: '',
    valid: false,
    dirty: true,
    icon: undefined,
    iconURL: undefined,
    warningDialog: false,
    // eslint-disable-next-line react/no-unused-state
    organizationId: undefined,
  };

  frame = React.createRef();

  async componentDidMount() {
    const {
      history,
      match,
      push,
      location,
      intl: { formatMessage },
    } = this.props;
    const { id } = match.params;

    if (!location.hash) {
      history.push('#editor');
    }

    const {
      data: {
        definitions: { App: appSchema },
      },
    } = await axios.get('/api.json');

    try {
      const request = await axios.get(`/api/apps/${id}`);
      const { data } = request;
      const recipe = yaml.safeDump(data);
      const { data: style } = await axios.get(`/api/apps/${id}/style/core`);
      const { data: sharedStyle } = await axios.get(`/api/apps/${id}/style/shared`);

      this.setState({
        // eslint-disable-next-line react/no-unused-state
        appSchema,
        recipe,
        style,
        sharedStyle,
        initialRecipe: recipe,
        path: data.path,
        iconURL: `/api/apps/${id}/icon`,
        // eslint-disable-next-line react/no-unused-state
        organizationId: data.organizationId,
      });
    } catch (e) {
      if (e.response && (e.response.status === 404 || e.response.status === 401)) {
        push(formatMessage(messages.appNotFound));
      } else {
        push(formatMessage(messages.error));
      }

      history.push('/editor');
    }
  }

  onSave = event => {
    event.preventDefault();

    this.setState(
      (
        { appSchema, recipe, style, sharedStyle, organizationId },
        { intl: { formatMessage }, match, push },
      ) => {
        let app;
        // Attempt to parse the YAML into a JSON object
        try {
          app = yaml.safeLoad(recipe);
          app.organizationId = Number(organizationId);
          app.id = Number(match.params.id);
        } catch (error) {
          push(formatMessage(messages.invalidYaml));
          return { valid: false, dirty: false };
        }
        try {
          validateStyle(style);
          validateStyle(sharedStyle);
        } catch (error) {
          push(formatMessage(messages.invalidStyle));
          return { valid: false, dirty: false };
        }
        validate(appSchema, app)
          .then(() => {
            this.setState({ valid: true, dirty: false });

            // YAML and schema appear to be valid, send it to the app preview iframe
            // eslint-disable-next-line react/prop-types
            this.frame.current.contentWindow.postMessage(
              { type: 'editor/EDIT_SUCCESS', app, style, sharedStyle },
              window.location.origin,
            );
          })
          .catch(error => {
            this.setState(() => {
              if (error instanceof SchemaValidationError) {
                const errors = error.data;
                push({
                  body: formatMessage(messages.schemaValidationFailed, {
                    properties: Object.keys(errors).join(', '),
                  }),
                });
              } else {
                push(formatMessage(messages.unexpected));
              }

              return { valid: false, dirty: false };
            });
          });
        return null;
      },
    );
  };

  uploadApp = async () => {
    const { intl, match, push } = this.props;
    const { recipe, style, sharedStyle, icon, valid } = this.state;

    if (!valid) {
      return;
    }

    const { id } = match.params;
    const app = yaml.safeLoad(recipe);
    let { path } = app;

    try {
      const formData = new FormData();
      formData.append('app', JSON.stringify(app));
      formData.append('style', new Blob([style], { type: 'text/css' }));
      formData.append('sharedStyle', new Blob([sharedStyle], { type: 'text/css' }));
      ({
        data: { path },
      } = await axios.put(`/api/apps/${id}`, formData));
      push({ body: intl.formatMessage(messages.updateSuccess), color: 'success' });
    } catch (e) {
      if (e.response && e.response.status === 403) {
        push(intl.formatMessage(messages.forbidden));
      } else {
        push(intl.formatMessage(messages.errorUpdate));
      }

      return;
    }

    if (icon) {
      try {
        await axios.post(`/api/apps/${id}/icon`, icon, {
          headers: { 'Content-Type': icon.type },
        });
      } catch (e) {
        push(intl.formatMessage(messages.errorUpdateIcon));
      }
    }

    this.setState({ dirty: true, warningDialog: false, initialRecipe: recipe, path });
  };

  onUpload = async () => {
    const { recipe, initialRecipe, valid } = this.state;

    if (valid) {
      const app = yaml.safeLoad(recipe);
      const originalApp = yaml.safeLoad(initialRecipe);

      if (!isEqual(app.definitions, originalApp.definitions)) {
        this.setState({ warningDialog: true });
        return;
      }

      await this.uploadApp();
    }
  };

  onMonacoChange = value => {
    const {
      location: { hash: tab },
    } = this.props;

    switch (tab) {
      case '#editor':
        this.setState({ recipe: value, dirty: true });
        break;
      case '#style-core':
        this.setState({ style: value, dirty: true });
        break;
      case '#style-shared':
        this.setState({ sharedStyle: value, dirty: true });
        break;
      default:
        break;
    }
  };

  onIconChange = e => {
    const { match } = this.props;
    const { id } = match.params;
    const file = e.target.files[0];

    this.setState({
      icon: file,
      iconURL: file ? URL.createObjectURL(file) : `/api/apps/${id}/icon`,
      dirty: true,
    });
  };

  onClose = () => {
    this.setState({ warningDialog: false });
  };

  render() {
    const {
      recipe,
      style,
      sharedStyle,
      path,
      valid,
      dirty,
      icon,
      iconURL,
      warningDialog,
    } = this.state;
    const {
      location: { hash: tab },
    } = this.props;
    const filename = icon ? icon.name : 'Icon';

    if (!recipe) {
      return <Loader />;
    }

    const onValueChange = this.onMonacoChange;
    let value;
    let language;

    switch (tab) {
      case '#style-core':
        value = style;
        language = 'css';
        break;
      case '#style-shared':
        value = sharedStyle;
        language = 'css';
        break;
      case '#editor':
      default:
        value = recipe;
        language = 'yaml';
    }

    return (
      <div className={styles.root}>
        <div className={styles.leftPanel}>
          <form className={styles.editorForm} onSubmit={this.onSave}>
            <Navbar>
              <NavbarBrand>
                <NavbarItem>
                  <Button disabled={!dirty} type="submit">
                    Save
                  </Button>
                </NavbarItem>
                <NavbarItem>
                  <Button disabled={!valid || dirty} onClick={this.onUpload}>
                    Upload
                  </Button>
                </NavbarItem>
                <NavbarItem>
                  <File className={`${icon && 'has-name'}`}>
                    <FileLabel component="label">
                      <FileInput
                        accept="image/jpeg, image/png, image/tiff, image/webp, image/xml+svg"
                        name="icon"
                        onChange={this.onIconChange}
                      />
                      <FileCta>
                        <FileIcon fa="upload" />
                        <FileLabel>Icon</FileLabel>
                      </FileCta>
                      {icon && <FileName>{filename}</FileName>}
                    </FileLabel>
                  </File>
                  {iconURL && (
                    <Image alt="Icon" className={styles.iconPreview} size={32} src={iconURL} />
                  )}
                </NavbarItem>
                <NavbarItem>
                  <Button component="a" href={`/${path}`} target="_blank">
                    View live
                  </Button>
                </NavbarItem>
              </NavbarBrand>
            </Navbar>
            <Tab boxed className={styles.editorTabs}>
              <TabItem active={tab === '#editor'} value="editor">
                <Link to="#editor">
                  <Icon fa="file-code" />
                  Recipe
                </Link>
              </TabItem>
              <TabItem active={tab === '#style-core'} onClick={this.onTabChange} value="style-core">
                <Link to="#style-core">
                  <Icon fa="brush" />
                  Core Style
                </Link>
              </TabItem>
              <TabItem
                active={tab === '#style-shared'}
                onClick={this.onTabChange}
                value="style-shared"
              >
                <Link to="#style-shared">
                  <Icon fa="brush" />
                  Shared Style
                </Link>
              </TabItem>
            </Tab>
            <MonacoEditor
              className={styles.monacoEditor}
              language={language}
              onValueChange={onValueChange}
              value={value}
            />
            <Modal
              active={warningDialog}
              ModalCloseProps={{ size: 'large' }}
              onClose={this.onClose}
            >
              <Card>
                <CardHeader>
                  <CardHeaderTitle>
                    <FormattedMessage {...messages.resourceWarningTitle} />
                  </CardHeaderTitle>
                </CardHeader>
                <CardContent>
                  <FormattedMessage {...messages.resourceWarning} />
                </CardContent>
                <CardFooter>
                  <CardFooterItem className="is-link" component="a" onClick={this.onClose}>
                    <FormattedMessage {...messages.cancel} />
                  </CardFooterItem>
                  <CardFooterItem
                    className={`${styles.cardFooterButton} button is-warning`}
                    component="button"
                    onClick={this.uploadApp}
                    type="button"
                  >
                    <FormattedMessage {...messages.upload} />
                  </CardFooterItem>
                </CardFooter>
              </Card>
            </Modal>
          </form>
        </div>

        <div className={styles.rightPanel}>
          {path && (
            <iframe
              ref={this.frame}
              className={styles.appFrame}
              src={`/${path}`}
              title="Appsemble App Preview"
            />
          )}
        </div>
      </div>
    );
  }
}
