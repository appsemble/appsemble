import { applyRefs } from '@appsemble/react-components';
import { editor, KeyCode, KeyMod } from 'monaco-editor/esm/vs/editor/editor.api';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import './custom';

editor.setTheme('vs');

type Options = editor.IEditorOptions & editor.IGlobalEditorOptions;

interface MonacoEditorProps {
  /**
   * A class name to apply to the monaco editor element.
   */
  className?: string;

  /**
   * The current value of the editor.
   */
  value?: string;

  /**
   * The language of the editor.
   */
  language: string;

  /**
   * This is called whenever the value of the editor changes.
   *
   * @param event - The monaco change event.
   * @param value - The new value.
   */
  onChange?: (event: editor.IModelContentChangedEvent, value: string) => void;

  /**
   * Called when Ctrl-S is pressed.
   */
  onSave?: () => void;

  /**
   * Whether or not the editor is on read-only mode.
   */
  readOnly?: boolean;
}

const defaultOptions: Options = {
  insertSpaces: true,
  tabSize: 2,
  minimap: { enabled: false },
  readOnly: false,
};

/**
 * Render a Monaco standalone editor instance.
 *
 * The forwarded ref might not trigger a rerender of the parent component. Instead of passing a ref
 * object, it is recommended to use a state setter function.
 */
export const MonacoEditor = forwardRef<editor.IStandaloneCodeEditor, MonacoEditorProps>(
  ({ className, language, onChange, onSave, readOnly = false, value = '' }, ref) => {
    const [monaco, setMonaco] = useState<editor.IStandaloneCodeEditor>();

    const saveRef = useRef(onSave);
    saveRef.current = onSave;

    const nodeRef = useCallback((node: HTMLDivElement) => {
      if (!node) {
        return () => {
          applyRefs(null, ref);
        };
      }

      const model = editor.createModel('', 'yaml');
      const ed = editor.create(node, { ...defaultOptions, readOnly, model });
      ed.addCommand(KeyMod.CtrlCmd | KeyCode.KEY_S, () => saveRef.current?.());

      const observer = new ResizeObserver(() => ed.layout());
      observer.observe(node);

      applyRefs(ed, setMonaco, ref);

      return () => {
        ed.dispose();
        observer.unobserve(node);
        applyRefs(null, ref);
      };
      // This is triggered by the lack of options in the dependency array. This is left out on
      // purpose. Instead, this is handled using monaco.updateOptions() below.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (monaco) {
        monaco.updateOptions({ readOnly });
      }
    }, [monaco, readOnly]);

    useEffect(() => {
      if (monaco) {
        editor.setModelLanguage(monaco.getModel(), language);
      }
    }, [language, monaco]);

    useEffect(() => {
      if (monaco && monaco.getModel().getValue() !== value) {
        monaco.getModel().setValue(value);
      }
    }, [monaco, value]);

    useEffect(() => {
      if (!monaco || !onChange) {
        return;
      }
      const model = monaco.getModel();
      const subscription = model.onDidChangeContent((event) => onChange(event, model.getValue()));

      return () => subscription.dispose();
    }, [monaco, onChange]);

    return <div className={className} ref={nodeRef} />;
  },
);
