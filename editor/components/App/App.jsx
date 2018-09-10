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

  async componentDidMount() {
    const { data } = await axios.get('/api/apps/1');
    const recipe = yaml.safeDump(data);

    this.setState({ recipe });
  }

  onSubmit = (event) => {
    event.preventDefault();
    this.setState(({ recipe }) => {
      let app = null;

      // Attempt to parse the YAML into a JSON object
      try {
        app = yaml.safeLoad(recipe);
      } catch (e) {
        return { valid: false };
      }

      // YAML appears to be valid, send it to the app preview iframe
      this.frame.contentWindow.postMessage({ type: 'editor/EDIT_SUCCESS', app }, window.location.origin);
      return { valid: true };
    });
  };

  onMonacoChange = (recipe) => {
    this.setState({ recipe });
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
