import { editor } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { ReactElement, useEffect, useRef } from 'react';

interface CodeBlockProps {
  /**
   * A class name to add to the `div` element.
   */
  className?: string;

  /**
   * The code to use as the original code before modification.
   */
  original: string;

  /**
   * Modified version of the code.
   */
  modified: string;

  /**
   * The language to use for highlighting the code.
   */
  language: string;
}

/**
 * Render a code diff block using syntax highlighting based on Monaco editor.
 */
export function CodeDiffBlock({
  className,
  language,
  modified,
  original,
}: CodeBlockProps): ReactElement {
  const ref = useRef<HTMLDivElement>();

  useEffect(() => {
    const ed = editor.createDiffEditor(ref.current, {
      automaticLayout: true,
      enableSplitViewResizing: false,
      renderSideBySide: false,
      minimap: { enabled: false },
      readOnly: true,
    });
    ed.setModel({
      original: editor.createModel(original, language),
      modified: editor.createModel(modified, language),
    });

    return () => ed.dispose();
  }, [original, language, modified]);

  return <div className={className} ref={ref} />;
}
