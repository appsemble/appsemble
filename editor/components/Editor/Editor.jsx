import {
  Navbar,
  NavbarBrand,
  NavbarBurger,
  NavbarEnd,
  NavbarMenu,
  NavbarItem,
  NavbarStart,
  Button,
  Icon,
  Image,
  File,
  FileCta,
  FileLabel,
  FileIcon,
  FileInput,
  FileName,
} from '@appsemble/react-bulma';
import axios from 'axios';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import React from 'react';
import yaml from 'js-yaml';
import validate, { SchemaValidationError } from '@appsemble/utils/validate';

import MonacoEditor from './components/MonacoEditor';
import styles from './editor.css';
import messages from './messages';

export default class Editor extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    push: PropTypes.func.isRequired,
  };

  state = {
    appSchema: {},
    recipe: '',
    valid: false,
    dirty: true,
    icon: undefined,
    iconURL: undefined,
    openMenu: false,
  };

  frame = React.createRef();

  async componentDidMount() {
    const {
      id,
      history,
      push,
      intl: { formatMessage },
    } = this.props;
    const {
      data: {
        definitions: { App: appSchema },
      },
    } = await axios.get('/api.json');

    try {
      const request = await axios.get(`/api/apps/${id}`);
      const { data } = request;
      const recipe = yaml.safeDump(data);

      this.setState({ appSchema, recipe, path: data.path, iconURL: `/api/apps/${id}/icon` });
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

    const {
      push,
      intl: { formatMessage },
    } = this.props;
    const { appSchema } = this.state;

    this.setState(({ recipe }) => {
      try {
        // Attempt to parse the YAML into a JSON object
        const app = yaml.safeLoad(recipe);
        validate(appSchema, app).catch(error => {
          throw error;
        });

        // YAML and schema appear to be valid, send it to the app preview iframe
        this.frame.current.contentWindow.postMessage(
          { type: 'editor/EDIT_SUCCESS', app },
          window.location.origin,
        );

        return { valid: true, dirty: false };
      } catch (e) {
        if (e instanceof SchemaValidationError) {
          const errors = e.data;
          push({
            body: formatMessage(messages.schemaValidationFailed, {
              properties: Object.keys(errors).join(', '),
            }),
          });
        } else {
          push(formatMessage(messages.invalidYaml));
        }

        return { valid: false, dirty: false };
      }
    });
  };

  onUpload = async () => {
    const {
      id,
      push,
      intl: { formatMessage },
    } = this.props;
    const { recipe, valid, icon } = this.state;

    if (valid) {
      try {
        await axios.put(`/api/apps/${id}`, yaml.safeLoad(recipe));
        push({ body: formatMessage(messages.updateSuccess), color: 'success' });
      } catch (e) {
        push(formatMessage(messages.errorUpdate));
      }
    }

    if (icon) {
      try {
        await axios.post(`/api/apps/${id}/icon`, icon, {
          headers: { 'Content-Type': icon.type },
        });
      } catch (e) {
        push(formatMessage(messages.errorUpdateIcon));
      }
    }

    this.setState({ dirty: true });
  };

  onLogout = () => {
    const { logout } = this.props;
    logout();
  };

  onMonacoChange = recipe => {
    this.setState({ recipe, dirty: true });
  };

  onIconChange = e => {
    const { id } = this.props;
    const file = e.target.files[0];

    this.setState({
      icon: file,
      iconURL: file ? URL.createObjectURL(file) : `/api/apps/${id}/icon`,
      dirty: true,
    });
  };

  render() {
    const { recipe, path, valid, dirty, icon, iconURL, openMenu } = this.state;
    const { id } = this.props;
    const filename = icon ? icon.name : 'Icon';

    return (
      <div className={styles.editor}>
        <div className={styles.leftPanel}>
          <form className={styles.editorForm} onSubmit={this.onSave}>
            <Navbar className="is-dark">
              <NavbarBrand>
                <NavbarItem>
                  <Link className={styles.navbarTitle} to="/editor">
                    Editor
                  </Link>
                </NavbarItem>
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
                <NavbarBurger
                  active={openMenu}
                  onClick={() => this.setState({ openMenu: !openMenu })}
                />
              </NavbarBrand>
              <NavbarMenu className={`${openMenu && 'is-active'}`}>
                <NavbarStart>
                  <NavbarItem>
                    <File className={`${icon && 'has-name'}`}>
                      <FileLabel component="label" htmlFor="icon-upload">
                        <FileInput
                          accept="image/jpeg, image/png, image/tiff, image/webp, image/xml+svg"
                          id="icon-upload"
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
                </NavbarStart>
                <NavbarEnd>
                  <NavbarItem>
                    <Button onClick={this.onLogout}>
                      <Icon fa="sign-out-alt" />
                      <span>
                        <FormattedMessage {...messages.logoutButton} />
                      </span>
                    </Button>
                  </NavbarItem>
                </NavbarEnd>
              </NavbarMenu>
            </Navbar>
            <MonacoEditor
              className={styles.monacoEditor}
              language="yaml"
              onValueChange={this.onMonacoChange}
              value={recipe}
            />
          </form>
        </div>

        <div className={styles.rightPanel}>
          {id &&
            path && (
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
