import { editor, KeyCode, KeyMod } from 'monaco-editor';
import * as React from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import styles from './index.css';

type Options = editor.IEditorOptions & editor.IGlobalEditorOptions;

interface MonacoEditorProps {
  /**
   * The current value of the editor.
   */
  value?: string;

  /**
   * The language of the editor.
   */
  language: string;

  /**
   * The global monaco theme.
   */
  theme?: string;

  /**
   * This is called whenever the value of the editor changes.
   *
   * @param event The monaco change event.
   * @param value The new value.
   */
  onChange?: (event: editor.IModelContentChangedEvent, value: string) => void;

  /**
   * Called when Ctrl-S is pressed.
   */
  onSave?: () => void;

  /**
   * Editor options to set.
   */
  options?: Options;
}

const defaultOptions: Options = {
  insertSpaces: true,
  tabSize: 2,
  minimap: { enabled: false },
};

export default function MonacoEditor({
  language,
  onChange,
  onSave,
  options = defaultOptions,
  theme = 'vs',
  value = '',
}: MonacoEditorProps): React.ReactElement {
  const ref = React.useRef<HTMLDivElement>();
  const [monaco, setMonaco] = React.useState<editor.IStandaloneCodeEditor>();

  const saveRef = React.useRef(onSave);
  saveRef.current = onSave;

  React.useEffect(() => {
    const node = ref.current;
    const ed = editor.create(node, options);
    // eslint-disable-next-line no-bitwise
    ed.addCommand(KeyMod.CtrlCmd | KeyCode.KEY_S, () => saveRef.current?.());

    const observer = new ResizeObserver(() => ed.layout());
    observer.observe(node);

    setMonaco(ed);

    return () => {
      ed.dispose();
      observer.unobserve(node);
    };
    // This is triggered by the lack of options in the dependency array. This is left out on
    // purpose. Instead, this is handled using monaco.updateOptions() below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (monaco) {
      monaco.updateOptions(options);
    }
  }, [monaco, options]);

  React.useEffect(() => editor.setTheme(theme), [theme]);

  React.useEffect(() => {
    if (monaco) {
      editor.setModelLanguage(monaco.getModel(), language);
    }
  }, [language, monaco]);

  React.useEffect(() => {
    if (monaco) {
      monaco.getModel().setValue(value);
    }
  }, [monaco, value]);

  React.useEffect(() => {
    if (!monaco) {
      return undefined;
    }
    const model = monaco.getModel();
    const subscription = model.onDidChangeContent((event) => onChange(event, model.getValue()));

    return () => subscription.dispose();
  }, [monaco, onChange]);

  return <div ref={ref} className={styles.editor} />;
}
