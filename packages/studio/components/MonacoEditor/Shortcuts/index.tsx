import { Box, Button, IconButton, Modal } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from '../../../pages/apps/app/edit/messages.js';
import styles from './index.module.css';

interface IProps {
  isOpen: boolean;
  handleClose: () => void;
}

export function Shortcuts({ handleClose, isOpen }: IProps): ReactElement {
  return (
    <Modal
      footer={
        <div>
          <Button onClick={handleClose} type="button">
            Close
          </Button>
        </div>
      }
      isActive={isOpen}
      onClose={handleClose}
      title="Shortcuts"
    >
      <Box>
        <div className={styles.header}>
          <h2 className={styles.h2}>
            <FormattedMessage {...messages.shortcuts} />
          </h2>
          <IconButton
            aria-label="close shortcuts modal"
            className="icon-button"
            icon="close"
            onClick={handleClose}
            title="close"
            type="button"
          />
        </div>
        <div>
          <ul className={styles.shortcuts}>
            <li className={styles.shortcut}>
              <kbd className={styles.key_combo}>CTRL + S</kbd>
              <div className="action">
                <p>Saves changes</p>
              </div>
            </li>
            <li className={styles.shortcut}>
              <kbd className={styles.key_combo}>CTRL + Space</kbd>
              <div className="action">
                <p>Show auto complete suggestions</p>
              </div>
            </li>
            <li className={styles.shortcut}>
              <kbd className={styles.key_combo}>CTRL + C</kbd>
              <div className="action">
                <p>Copies selection. Copies line if there&apos;s no selection</p>
              </div>
            </li>
            <li className={styles.shortcut}>
              <kbd className={styles.key_combo}>CTRL + X</kbd>
              <div className="action">
                <p>Cuts selection. Cuts line if there&apos;s no selection</p>
              </div>
            </li>
            <li className={styles.shortcut}>
              <kbd className={styles.key_combo}>CTRL + V</kbd>
              <div className="action">
                <p>Pastes copied text</p>
              </div>
            </li>
            <li className={styles.shortcut}>
              <kbd className={styles.key_combo}>CTRL + /</kbd>
              <div className="action">
                <p>Toggle line comment</p>
              </div>
            </li>
            <li className={styles.shortcut}>
              <kbd className={styles.key_combo}>CTRL + Z</kbd>
              <div className="action">
                <p>Undo</p>
              </div>
            </li>
            <li className={styles.shortcut}>
              <kbd className={styles.key_combo}>CTRL + Y</kbd>
              <div className="action">
                <p>Redo</p>
              </div>
            </li>
          </ul>
        </div>
      </Box>
    </Modal>
  );
}
