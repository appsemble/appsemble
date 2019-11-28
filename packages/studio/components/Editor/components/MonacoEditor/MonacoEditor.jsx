import 'monaco-editor/min/vs/editor/editor.main.css';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/basic-languages/css/css.contribution';

import { editor, KeyCode, KeyMod } from 'monaco-editor/esm/vs/editor/edcore.main';
import PropTypes from 'prop-types';
import React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import styles from './MonacoEditor.css';

export default class MonacoEditor extends React.Component {
  node = React.createRef();

  observer = null;

  static propTypes = {
    value: PropTypes.string,
    language: PropTypes.string.isRequired,
    theme: PropTypes.string,
    onValueChange: PropTypes.func,
    onSave: PropTypes.func,
    options: PropTypes.shape(),
  };

  static defaultProps = {
    value: '',
    onValueChange: null,
    onSave: null,
    theme: 'vs',
    options: { insertSpaces: true, tabSize: 2, minimap: { enabled: false } },
  };

  componentDidMount() {
    const { value, language, onValueChange, onSave, options } = this.props;
    const model = editor.createModel(value, language);

    this.editor = editor.create(this.node.current, options);
    this.editor.setModel(model);

    if (onSave) {
      // eslint-disable-next-line no-bitwise
      this.editor.addCommand(KeyMod.CtrlCmd | KeyCode.KEY_S, () => {
        onSave();
      });
    }

    this.subscription = model.onDidChangeContent(() => {
      onValueChange(model.getValue());
    });

    this.observer = new ResizeObserver(() => {
      this.editor.layout();
    });

    this.observer.observe(this.node.current);
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

    if (this.observer) {
      this.observer.unobserve(this.node.current);
    }
  }

  render() {
    return <div ref={this.node} className={styles.editor} />;
  }
}
