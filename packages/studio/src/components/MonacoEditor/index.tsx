import { applyRefs } from '@appsemble/react-components';
import classNames from 'classnames';
import { editor, KeyCode, KeyMod } from 'monaco-editor/esm/vs/editor/editor.api';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

import './custom';
import { Diagnostic } from './Diagnostic';
import styles from './index.module.css';

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

  /**
   * If true, render editor diagnostics in a pane below the editor.
   */
  showDiagnostics?: boolean;
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
  (
    { className, language, onChange, onSave, readOnly = false, showDiagnostics, value = '' },
    ref,
  ) => {
    const [monaco, setMonaco] = useState<editor.IStandaloneCodeEditor>();
    const [markers, setMarkers] = useState<editor.IMarker[]>([]);

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
      ed.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, () => saveRef.current?.());

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

    useEffect(() => {
      if (!monaco) {
        return;
      }
      const uri = String(monaco.getModel().uri);
      const disposable = editor.onDidChangeMarkers((resources) => {
        for (const resource of resources) {
          if (String(resource) === uri) {
            setMarkers(editor.getModelMarkers({ resource }));
            break;
          }
        }
      });

      return () => disposable.dispose();
    }, [monaco]);

    return (
      <div className={classNames('is-flex is-flex-direction-column', className)}>
        <div className="is-flex-grow-1 is-flex-shrink-1" ref={nodeRef} />
        {showDiagnostics ? (
          <div className={`is-flex-grow-1 is-flex-shrink-1 ${styles.diagnostics}`}>
            {markers.map((marker) => (
              <Diagnostic
                key={`${marker.code}-${marker.startLineNumber}-${marker.startColumn}-${marker.endLineNumber}-${marker.endColumn}`}
                marker={marker}
                monaco={monaco}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);
