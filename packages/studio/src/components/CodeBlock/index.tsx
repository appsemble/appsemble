import { downloadBlob } from '@appsemble/web-utils';
import classNames from 'classnames';
import { ReactElement, useCallback } from 'react';
import { Button } from 'react-components/src/Button';
import { useMessages } from 'react-components/src/MessagesProvider';
import { useIntl } from 'react-intl';

import { HighlightedCode, HighlightedCodeProps } from '../HighlightedCode';
import styles from './index.module.css';
import { messages } from './messages';

/**
 * This is a helper element for the clipboard button.
 *
 * To copy content to a clipboard, it must first be added to an existing element in the DOM.
 */
const textarea = document.createElement('textarea');
textarea.className = styles.hidden;
document.body.append(textarea);

interface CodeBlockProps {
  /**
   * A class name to add to the `pre` element.
   */
  className?: string;

  /**
   * If specified, a button is added for copying the code.
   */
  copy?: boolean;

  /**
   * The code to render.
   */
  children: ReactElement<HighlightedCodeProps> | string;

  /**
   * If specified, a button is added for downloading the code using the given filename.
   */
  filename?: string;

  /**
   * The language to use for highlighting the code.
   */
  language: string;
}

/**
 * Render a code block using syntax highlighting based on Monaco editor.
 */
export function CodeBlock({
  children,
  className,
  copy,
  filename,
  language,
}: CodeBlockProps): ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();

  const code = typeof children === 'string' ? children : children?.props.children;

  const onDownload = useCallback(() => {
    downloadBlob(code, filename);
  }, [code, filename]);

  const onCopy = useCallback(() => {
    textarea.value = code;
    textarea.select();
    if (document.execCommand('copy')) {
      push({ body: formatMessage(messages.copySuccess), color: 'success' });
    } else {
      push({ body: formatMessage(messages.copyError), color: 'danger' });
    }
    textarea.value = '';
  }, [code, formatMessage, push]);

  return (
    <div className={classNames(styles.root, className)}>
      <div className={`pt-2 ${styles.buttons}`}>
        {filename && (
          <Button
            className="mr-2"
            icon="download"
            onClick={onDownload}
            title={formatMessage(messages.download, { filename })}
          />
        )}
        {copy && (
          <Button
            className="mr-2"
            icon="clipboard"
            onClick={onCopy}
            title={formatMessage(messages.copy)}
          />
        )}
      </div>
      <pre className={styles.pre}>
        {typeof children === 'string' ? (
          <HighlightedCode className={language ? `language-${language}` : null}>
            {children}
          </HighlightedCode>
        ) : (
          children
        )}
      </pre>
    </div>
  );
}
