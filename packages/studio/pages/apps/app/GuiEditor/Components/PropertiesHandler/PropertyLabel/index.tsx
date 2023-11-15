import { Box, Icon } from '@appsemble/react-components';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { MarkdownContent } from '../../../../../../../components/MarkdownContent/index.js';

interface PropertyLabelProps {
  readonly label: string;
  readonly description?: string;
  readonly required: boolean;
}

export function PropertyLabel({ description, label, required }: PropertyLabelProps): ReactNode {
  const [isHovering, setIsHovering] = useState(false);
  const [hoveringOnBox, setHoveringOnBox] = useState(false);

  const onHoverHelp = useCallback(() => {
    setIsHovering(true);
  }, []);

  const onHoverHelpExit = useCallback(() => {
    setTimeout(() => {
      if (!hoveringOnBox) {
        setIsHovering(false);
      }
    }, 150);
  }, [hoveringOnBox]);

  const onHoverBox = useCallback(() => {
    setHoveringOnBox(true);
  }, []);

  const onHoverBoxExit = useCallback(() => {
    setHoveringOnBox(false);
    setIsHovering(false);
  }, []);

  if (!description) {
    return (
      <div className={styles.line}>
        <label className={styles.label}>{label}</label>
        {required ? (
          <span className="has-text-danger is-align-content-flex-end">*</span>
        ) : (
          <span className="is-pulled-right has-text-weight-normal is-align-content-flex-end">
            (<FormattedMessage {...messages.optional} />)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={styles.line}>
      <div>
        <label className={styles.label}>{label}</label>
        <Icon
          className="ml-2"
          color="info"
          icon="question-circle"
          onMouseEnter={onHoverHelp}
          onMouseLeave={onHoverHelpExit}
          size="small"
        />
        {isHovering || hoveringOnBox ? (
          <Box
            className={styles.tooltip}
            onMouseEnter={onHoverHelp}
            onMouseLeave={onHoverBoxExit}
            onMouseOver={onHoverBox}
          >
            <MarkdownContent className="ml-1" content={description} />
          </Box>
        ) : null}
      </div>
      <div>
        {required ? (
          <span className="has-text-danger is-align-content-flex-end">*</span>
        ) : (
          <span className="is-pulled-right is-align-content-flex-end has-text-weight-normal">
            (<FormattedMessage {...messages.optional} />)
          </span>
        )}
      </div>
    </div>
  );
}

export default PropertyLabel;
