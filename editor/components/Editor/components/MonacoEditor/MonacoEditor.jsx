import 'monaco-editor/min/vs/editor/editor.main.css';

import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';

import { editor } from 'monaco-editor/esm/vs/editor/edcore.main';
import React from 'react';
import PropTypes from 'prop-types';

import styles from './MonacoEditor.css';

export default class MonacoEditor extends React.Component {
  static propTypes = {
    value: PropTypes.string,
    language: PropTypes.string.isRequired,
    theme: PropTypes.string,
    onValueChange: PropTypes.func,
    options: PropTypes.shape(),
  };

  static defaultProps = {
    value: '',
    onValueChange: null,
    theme: 'vs',
    options: { insertSpaces: true, tabSize: 2, minimap: { enabled: false } },
  };

  node = React.createRef();

  componentDidMount() {
    const { value, language, onValueChange, options } = this.props;
    const model = editor.createModel(value, language);

    this.editor = editor.create(this.node.current, options);
    this.editor.setModel(model);

    this.subscription = model.onDidChangeContent(() => {
      onValueChange(model.getValue());
    });
  }

  componentDidUpdate(prevProps) {
    const { value, language, onValueChange, theme, ...options } = this.props;

    this.editor.updateOptions(options);
    const model = this.editor.getModel();

    if (prevProps.theme !== theme) {
      editor.setTheme(theme);
    }

    if (prevProps.language !== language || prevProps.onValueChange !== onValueChange) {
      editor.setModelLanguage(model, language);
      this.subscription.dispose();
      model.setValue(value);
      this.subscription = model.onDidChangeContent(() => {
        onValueChange(model.getValue());
      });
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
