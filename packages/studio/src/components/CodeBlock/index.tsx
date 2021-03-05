import { ReactElement, useEffect, useRef } from 'react';

import styles from './index.module.css';

interface CodeBlockProps {
  /**
   * A class name to add to the `pre` element.
   */
  className?: string;

  /**
   * The code to render.
   */
  code: string;

  /**
   * Modified version of the code, will display as a diff editor if set.
   */
  modified?: string;

  /**
   * The language to use for highlighting the code.
   */
  language: string;
}

/**
 * Render a code block using syntax highlighting based on Monaco editor.
 */
export function CodeBlock({ className, code, language, modified }: CodeBlockProps): ReactElement {
  const ref = useRef();

  useEffect(() => {
    let dispose: () => void;
    if (language) {
      import('monaco-editor').then(({ editor }) => {
        if (modified) {
          const ed = editor.createDiffEditor(ref.current, {
            enableSplitViewResizing: false,
            renderSideBySide: false,
            minimap: { enabled: false },
            readOnly: true,
          });
          ed.setModel({
            original: editor.createModel(code, language),
            modified: editor.createModel(modified, language),
          });
          ({ dispose } = ed);
        } else {
          editor.colorizeElement(ref.current, { mimeType: language, theme: 'vs' });
        }
      });
    }

    return () => {
      if (dispose) {
        dispose();
      }
    };
  }, [code, language, modified]);

  return modified ? (
    <div className={`${className} ${styles.diff}`} ref={ref} />
  ) : (
    <pre className={className} ref={ref}>
      {code}
    </pre>
  );
}
