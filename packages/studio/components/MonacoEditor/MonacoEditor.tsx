import { editor, IDisposable, KeyCode, KeyMod } from 'monaco-editor';
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import styles from './MonacoEditor.css';

interface MonacoEditorProps {
  value?: string;
  language: string;
  theme?: string;
  onValueChange: (value: string) => void;
  onSave: () => void;
  options: editor.IEditorOptions;
}

export default class MonacoEditor extends React.Component<MonacoEditorProps> {
  node = React.createRef<HTMLDivElement>();

  observer: ResizeObserver = null;

  editor: editor.IStandaloneCodeEditor;

  subscription: IDisposable;

  static defaultProps = {
    value: '',
    theme: 'vs',
    options: { insertSpaces: true, tabSize: 2, minimap: { enabled: false } },
  };

  componentDidMount(): void {
    const { value, language, options } = this.props;
    const model = editor.createModel(value, language);

    this.editor = editor.create(this.node.current, options);
    this.editor.setModel(model);

    // eslint-disable-next-line no-bitwise
    this.editor.addCommand(KeyMod.CtrlCmd | KeyCode.KEY_S, this.onMonacoSave);

    this.subscription = model.onDidChangeContent(this.onMonacoValueChange);

    this.observer = new ResizeObserver(() => {
      this.editor.layout();
    });

    this.observer.observe(this.node.current);
  }

  componentDidUpdate(prevProps: MonacoEditorProps): void {
    const { value, language, theme, options } = this.props;

    this.editor.updateOptions(options);
    const model = this.editor.getModel();

    if (prevProps.theme !== theme) {
      editor.setTheme(theme);
    }

    if (prevProps.language !== language) {
      editor.setModelLanguage(model, language);
    }

    if (value !== model.getValue()) {
      model.setValue(value);
    }
  }

  componentWillUnmount(): void {
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

  onMonacoSave = (): void => {
    this.props.onSave();
  };

  onMonacoValueChange = (): void => {
    this.props.onValueChange(this.editor.getModel().getValue());
  };

  render(): React.ReactElement {
    return <div ref={this.node} className={styles.editor} />;
  }
}
