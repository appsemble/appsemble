import 'monaco-editor/min/vs/editor/editor.main.css';

import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/language/css/monaco.contribution';

import { editor } from 'monaco-editor/esm/vs/editor/edcore.main';
import React from 'react';
import PropTypes from 'prop-types';

import styles from './monacoeditor.css';

export default class MonacoEditor extends React.Component {
  static propTypes = {
    path: PropTypes.string,
    value: PropTypes.string,
    language: PropTypes.string,
    theme: PropTypes.string,
    onValueChange: PropTypes.func,
    options: PropTypes.shape(),
  };

  static defaultProps = {
    path: '',
    value: '',
    language: 'javascript',
    onValueChange: null,
    theme: 'vs',
    options: { tabSize: 2, minimap: { enabled: false } },
  };

  node = React.createRef();

  componentDidMount() {
    const { path, value, language, onValueChange, options } = this.props;
    const model = path
      ? editor.createModel(value, language, path)
      : editor.createModel(value, language);

    this.editor = editor.create(this.node.current, options);
    this.editor.setModel(model);

    this.subscription = model.onDidChangeContent(() => {
      onValueChange(model.getValue());
    });
  }

  componentDidUpdate(prevProps) {
    const { path, value, language, onValueChange, theme, ...options } = this.props;

    this.editor.updateOptions(options);
    const model = this.editor.getModel();

    if (prevProps.theme !== theme) {
      editor.setTheme(theme);
    }

    if (value !== model.getValue()) {
      model.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: value,
          },
        ],
      );
    }
  }

  componentWillUnmount() {
    if (this.editor) {
      this.editor.dispose();
    }

    if (this.subscription) {
      this.subscription.dispose();
    }
  }

  render() {
    return <div ref={this.node} className={styles.editor} />;
  }
}
