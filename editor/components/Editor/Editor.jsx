import axios from 'axios';
import MonacoEditor from 'react-monaco-editor';
import PropTypes from 'prop-types';
import React from 'react';
import yaml from 'js-yaml';

import styles from './editor.css';

export default class Editor extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    push: PropTypes.func.isRequired,
  };

  state = {
    recipe: '',
    valid: false,
    dirty: true,
  };

  frame = React.createRef();

  async componentDidMount() {
    const { id, history, push } = this.props;

    try {
      const request = await axios.get(`/api/apps/${id}`);
      const { data } = request;
      const recipe = yaml.safeDump(data);

      this.setState({ recipe, path: data.path });
    } catch (e) {
      if (e.response && (e.response.status === 404 || e.response.status === 401)) {
        push('App does not exist');
      } else {
        push('Something went wrong trying to load this app');
      }

      history.push('/editor');
    }
  }

  onSubmit = event => {
    event.preventDefault();
    const { push } = this.props;

    this.setState(({ recipe }) => {
      let app = null;

      // Attempt to parse the YAML into a JSON object
      try {
        app = yaml.safeLoad(recipe);
      } catch (e) {
        push('Invalid YAML');
        return { valid: false, dirty: false };
      }

      // YAML appears to be valid, send it to the app preview iframe
      this.frame.current.contentWindow.postMessage(
        { type: 'editor/EDIT_SUCCESS', app },
        window.location.origin,
      );

      return { valid: true, dirty: false };
    });
  };

  onUpload = async () => {
    const { id, push } = this.props;
    const { recipe, valid, icon } = this.state;

    if (valid) {
      try {
        await axios.put(`/api/apps/${id}`, yaml.safeLoad(recipe));
        push({ body: 'Successfully updated app definition', color: 'success' });
      } catch (e) {
        push('Something went wrong trying to update the app definition');
      }
    }

    if (icon) {
      try {
        await axios.post(`/api/apps/${id}/icon`, icon, {
          headers: { 'Content-Type': icon.type },
        });
      } catch (e) {
        push('Something went wrong trying to update the app icon');
      }
    }

    this.setState({ dirty: true });
  };

  onMonacoChange = recipe => {
    this.setState({ recipe, dirty: true });
  };

  onIconChange = e => {
    this.setState({ icon: e.target.files[0], dirty: true });
  };

  render() {
    const { recipe, path, valid, dirty } = this.state;
    const { id } = this.props;

    return (
      <div className={styles.editor}>
        <div className={styles.leftPanel}>
          <form className={styles.editorForm} onSubmit={this.onSubmit}>
            <div className={styles.editorToolbar}>
              <button className="button" disabled={!dirty} type="submit">
                Save
              </button>
              <button
                className="button"
                disabled={!valid || dirty}
                onClick={this.onUpload}
                type="button"
              >
                Upload
              </button>
              <input
                accept="image/jpeg, image/png, image/tiff, image/webp, image/xml+svg"
                className="button"
                name="icon"
                onChange={this.onIconChange}
                type="file"
              />
            </div>
            <MonacoEditor
              className={styles.monacoEditor}
              language="yaml"
              onChange={this.onMonacoChange}
              options={{ tabSize: 2, minimap: { enabled: false } }}
              theme="vs"
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
