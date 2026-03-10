import { Button, useMessages } from '@appsemble/react-components';
import { downloadBlob } from '@appsemble/web-utils';
import classNames from 'classnames';
import indentString from 'indent-string';
import { type ReactElement, type ReactNode, useCallback } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { HighlightedCode, type HighlightedCodeProps } from '../HighlightedCode/index.js';

interface CodeBlockProps {
  /**
   * A class name to add to the `pre` element.
   */
  readonly className?: string;

  /**
   * If specified, a button is added for copying the code.
   */
  readonly copy?: boolean;

  /**
   * The code to render.
   */
  // eslint-disable-next-line @typescript-eslint/no-restricted-types
  readonly children: ReactElement<HighlightedCodeProps> | string;

  /**
   * If specified, a button is added for downloading the code using the given filename.
   */
  readonly filename?: string;

  /**
   * Indent the code by this number of spaces.
   */
  readonly indent?: number;

  /**
   * The language to use for highlighting the code.
   */
  readonly language?: string;
}

/**
 * Render a code block using syntax highlighting based on Monaco editor.
 */
export function CodeBlock({
  children,
  className,
  copy,
  filename,
  indent,
  language,
}: CodeBlockProps): ReactNode {
  const { formatMessage } = useIntl();
  const push = useMessages();

  let code = children;
  let codeClassName: string;
  if (Array.isArray(code)) {
    [code] = code;
  }
  if (typeof code !== 'string') {
    codeClassName = code.props.className;
    code = code.props.children;
  }
  if (Array.isArray(code)) {
    [code] = code;
  }
  if (typeof code === 'string' && indent) {
    code = indentString(code, indent);
  }

  const onDownload = useCallback(() => {
    downloadBlob(code as string, filename);
  }, [code, filename]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code as string);
      push({ body: formatMessage(messages.copySuccess), color: 'success' });
    } catch {
      push({ body: formatMessage(messages.copyError), color: 'danger' });
    }
  }, [code, formatMessage, push]);

  return (
    <div className={classNames(styles.root, className)}>
      <div className={`pt-2 ${styles.buttons}`}>
        {filename ? (
          <Button
            className="mr-2"
            icon="download"
            onClick={onDownload}
            title={formatMessage(messages.download, { filename })}
          />
        ) : null}
        {copy ? (
          <Button
            className="mr-2"
            icon="clipboard"
            onClick={onCopy}
            title={formatMessage(messages.copy)}
          />
        ) : null}
      </div>
      <pre className={styles.pre}>
        {typeof code === 'string' ? (
          <HighlightedCode
            className={classNames(codeClassName, language ? `language-${language}` : null)}
          >
            {code}
          </HighlightedCode>
        ) : (
          children
        )}
      </pre>
    </div>
  );
}
