import axios from 'axios';
import MonacoEditor from 'react-monaco-editor';
import PropTypes from 'prop-types';
import React from 'react';
import yaml from 'js-yaml';

import styles from './editor.css';

export default class Editor extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
  };

  state = {
    recipe: '',
    valid: false,
    dirty: true,
  };

  frame = React.createRef();

  async componentDidMount() {
    const { id } = this.props;
    const { data } = await axios.get(`/api/apps/${id}`);
    const recipe = yaml.safeDump(data);

    this.setState({ recipe });
  }

  onSubmit = (event) => {
    if (event) event.preventDefault();

    this.setState(({ recipe }) => {
      let app = null;

      // Attempt to parse the YAML into a JSON object
      try {
        app = yaml.safeLoad(recipe);
      } catch (e) {
        return { valid: false, dirty: false };
      }

      // YAML appears to be valid, send it to the app preview iframe
      this.frame.current.contentWindow.postMessage({ type: 'editor/EDIT_SUCCESS', app }, window.location.origin);
      return { valid: true, dirty: false };
    });
  };

  onUpload = async () => {
    const { id } = this.props;
    const { recipe, valid } = this.state;

    if (valid) {
      await axios.put(`/api/apps/${id}`, yaml.safeLoad(recipe));
    }

    this.setState({ dirty: true });
  };

  onMonacoChange = (recipe) => {
    this.setState({ recipe, dirty: true });
  };

  render() {
    const { recipe, valid, dirty } = this.state;
    const { id } = this.props;

    return (
      <div className={styles.editor}>
        <div className={styles.leftPanel}>
          <form className={styles.editorForm} onSubmit={this.onSubmit}>
            <div className={styles.editorToolbar}>
              <button type="submit" disabled={!dirty}>Save</button>
              <button type="button" onClick={this.onUpload} disabled={!valid || dirty}>Upload</button>
              { (!valid && !dirty)
                && <p className={styles.editorError}>Invalid YAML</p>
              }
            </div>
            <MonacoEditor
              language="yaml"
              theme="vs"
              value={recipe}
              className={styles.monacoEditor}
              options={{ tabSize: 2, minimap: { enabled: false } }}
              onChange={this.onMonacoChange}
            />
          </form>
        </div>

        <div className={styles.rightPanel}>
          { id && <iframe className={styles.appFrame} title="Appsemble App Preview" ref={this.frame} src={`/${id}`} /> }
        </div>
      </div>
    );
  }
}
