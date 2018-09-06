import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/yaml/yaml';

import AceEditor from 'react-ace';
import axios from 'axios';
import 'brace';
import { Controlled as CodeMirror } from 'react-codemirror2';
import MonacoEditor from 'react-monaco-editor';
import yaml from 'js-yaml';
import React from 'react';
import styles from './app.css';
import 'brace/mode/yaml';
import 'brace/theme/chrome';

export default class App extends React.Component {
  state = {
    recipe: '',
    valid: true,
    editor: 'Monaco',
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
    const { recipe, valid, editor } = this.state;

    return (
      <div className={styles.editor}>
        <div className={styles.leftPanel}>
          <form className={styles.editorForm} onSubmit={this.onSubmit}>
            <div className={styles.editorToolbar}>
              <button type="submit">Save</button>
              <select onChange={(e) => { this.setState({ editor: e.target.value }); }}>
                <option value="Monaco">Monaco</option>
                <option value="Ace">Ace</option>
                <option value="CodeMirror">CodeMirror</option>
              </select>
              { !valid
                && <p className={styles.editorError}>Invalid YAML</p>
              }
            </div>

            {editor === 'Ace'
            && (
              <AceEditor
                mode="yaml"
                theme="chrome"
                width="100%"
                height="500px"
                className={styles.aceEditor}
                tabSize={2}
                value={recipe}
                onChange={this.onChange}
              />
            )}

            {editor === 'Monaco' && (
              <MonacoEditor
                language="yaml"
                theme="vs"
                value={recipe}
                className={styles.aceEditor}
                options={{ tabSize: 2 }}
                onChange={this.onMonacoChange}
              />
            )}

            {editor === 'CodeMirror' && (
              <CodeMirror
                value={recipe}
                className={styles.aceEditor}
                options={{
                  tabSize: 2, mode: 'yaml', lineNumbers: true, lint: true,
                }}
                onBeforeChange={(e, data, value) => { this.onChange(value); }}
              />
            )}

          </form>
        </div>

        <div className={styles.rightPanel}>
          <iframe className={styles.appFrame} title="Appsemble App Preview" ref={(ref) => { this.frame = ref; }} src="/1" />
        </div>
      </div>
    );
  }
}
