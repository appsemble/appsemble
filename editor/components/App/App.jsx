import axios from 'axios';
import MonacoEditor from 'react-monaco-editor';
import React from 'react';
import yaml from 'js-yaml';

import styles from './app.css';

export default class App extends React.Component {
  state = {
    recipe: '',
    valid: true,
  };

  frame = null;

  componentDidMount() {
    axios.get('/api/apps/1').then((response) => {
      const recipe = yaml.safeDump(response.data);

      this.setState({ recipe });
    });
  }

  onChange = (event) => {
    this.setState({ recipe: event });

    // this.setState({ recipe: event.target.value });
  };

  onSubmit = (event) => {
    event.preventDefault();
    const { recipe } = this.state;
    let app = null;

    // Attempt to parse the YAML into a JSON object
    try {
      app = yaml.safeLoad(recipe);
    } catch (e) {
      this.setState({ valid: false });
      return;
    }

    // YAML appears to be valid, send it to the app preview iframe
    this.setState({ valid: true });
    this.frame.contentWindow.postMessage({ type: 'editor/EDIT_SUCCESS', app }, window.location.origin);
  };

  onMonacoChange = (newValue) => {
    this.setState({ recipe: newValue });
  };

  render() {
    const { recipe, valid } = this.state;

    return (
      <div className={styles.editor}>
        <div className={styles.leftPanel}>
          <form className={styles.editorForm} onSubmit={this.onSubmit}>
            <div className={styles.editorToolbar}>
              <button type="submit">Save</button>
              { !valid
                && <p className={styles.editorError}>Invalid YAML</p>
              }
            </div>
            <MonacoEditor
              language="yaml"
              theme="vs"
              value={recipe}
              className={styles.monacoEditor}
              options={{ tabSize: 2 }}
              onChange={this.onMonacoChange}
            />
          </form>
        </div>

        <div className={styles.rightPanel}>
          <iframe className={styles.appFrame} title="Appsemble App Preview" ref={(ref) => { this.frame = ref; }} src="/1" />
        </div>
      </div>
    );
  }
}
