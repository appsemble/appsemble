import { Icon } from '@appsemble/react-components';
import { type editor, MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api.js';
import { type ReactNode, useCallback } from 'react';

import styles from './index.module.css';

interface DiagnosticProps {
  /**
   * The diagnostic marker to render.
   */
  readonly marker: editor.IMarker;

  /**
   * The Monaco editor instance to which the diagnostic applies.
   */
  readonly monaco: editor.IStandaloneCodeEditor;
}

/**
 * Render a clickable Monaco editor diagnostic.
 */
export function Diagnostic({ marker, monaco }: DiagnosticProps): ReactNode {
  const activate = useCallback(() => {
    monaco.setPosition({
      lineNumber: marker.startLineNumber,
      column: marker.startColumn,
    });
    monaco.revealLine(marker.startLineNumber);
    monaco.focus();
  }, [marker, monaco]);

  return (
    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
    <div
      className={styles.root}
      onClick={activate}
      onKeyDown={activate}
      role="button"
      tabIndex={-1}
    >
      {marker.severity === MarkerSeverity.Warning ? (
        <Icon className="has-text-warning mx-1" icon="exclamation-triangle" size="small" />
      ) : (
        <Icon className="has-text-danger mx-1" icon="circle-xmark" size="small" />
      )}
      {marker.message}
      <span className="has-text-grey-light pl-1">
        [{marker.startLineNumber}, {marker.startColumn}]
      </span>
    </div>
  );
}
