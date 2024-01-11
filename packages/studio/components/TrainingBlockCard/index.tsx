import { Button, Icon, useConfirmation, useMessages } from '@appsemble/react-components';
import { type TrainingBlock } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import axios from 'axios';
import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { checkRole } from '../../utils/checkRole.js';
import TrainingBlockModal, { type defaults } from '../TrainingBlockModal/index.js';
import { useUser } from '../UserProvider/index.js';

export interface TrainingBlockCardProps {
  readonly blockId: string;
  readonly title: string;
  readonly linkToDocumentation: string;
  readonly linkToVideo: string;
  readonly exampleCode: string;
  readonly externalResource: string;
}

export function TrainingBlockCard({
  blockId,
  exampleCode,
  externalResource,
  linkToDocumentation,
  linkToVideo,
  title,
}: TrainingBlockCardProps): ReactNode {
  const push = useMessages();
  const { hash } = useLocation();
  const navigate = useNavigate();

  const openEditDialog = useCallback(() => {
    navigate({ hash: `edit-block-${blockId}` }, { replace: true });
  }, [navigate, blockId]);

  const closeEditDialog = useCallback(() => {
    navigate({ hash: null }, { replace: true });
  }, [navigate]);

  const { formatMessage } = useIntl();
  const { organizations } = useUser();
  const [showMenu, setShowMenu] = useState(false);

  const isAppsembleMember = organizations?.find((org) => org.id === 'appsemble');
  const mayDeleteTraining =
    isAppsembleMember && checkRole(isAppsembleMember.role, Permission.DeleteApps);

  const blockDefaultValues = {
    exampleCodeBlock: exampleCode,
    externalResourceLink: externalResource,
    documentationLink: linkToDocumentation,
    videoLink: linkToVideo,
    titleOfBlock: title,
  };

  const onDeleteTrainingBlock = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.confirm} />,
    async action() {
      try {
        await axios.delete(`/api/training/blocks/${blockId}`);
        push({
          body: formatMessage(messages.deleteSuccess),
          color: 'info',
        });
        window.location.reload();
      } catch {
        push({
          body: formatMessage(messages.deleteError),
          color: 'danger',
        });
      }
    },
  });

  const onEditTrainingBlock = useCallback(
    async ({
      documentationLink,
      exampleCodeBlock,
      externalResourceLink,
      titleOfBlock,
      videoLink,
    }: typeof defaults) => {
      const formData = new FormData();
      formData.set('title', titleOfBlock);
      if (documentationLink) {
        formData.set('documentationLink', documentationLink);
      } else {
        formData.set('documentationLink', '');
      }
      if (videoLink) {
        formData.set('videoLink', videoLink);
      } else {
        formData.set('videoLink', '');
      }
      if (exampleCodeBlock) {
        formData.set('exampleCode', exampleCodeBlock);
      } else {
        formData.set('exampleCode', '');
      }
      if (externalResourceLink) {
        formData.set('externalResource', externalResourceLink);
      } else {
        formData.set('externalResource', '');
      }

      await axios.patch<TrainingBlock>(`/api/training/blocks/${blockId}`, formData);
      closeEditDialog();

      window.location.reload();
    },
    [blockId, closeEditDialog],
  );

  const active = hash === `#edit-block-${blockId}`;

  const copyToClipboard = useCallback(async (value: string) => {
    await navigator.clipboard.writeText(value);
  }, []);
  const dropdownRef = useRef(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      // Close the menu if clicked outside of the dropdown menu
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    },
    [setShowMenu],
  );

  useLayoutEffect(() => {
    // Attach the click event listener to the document when the component mounts
    document.addEventListener('click', handleClickOutside);

    // Detach the event listener when the component unmounts
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div className={`card ${styles.block} mb-3`}>
      <div className={`card-content ${styles.content}`}>
        {mayDeleteTraining ? (
          <div className="dropdown is-pulled-right is-right is-active" ref={dropdownRef}>
            <div className="dropdown-trigger">
              <Button
                aria-controls="dropdown-menu"
                aria-haspopup="true"
                icon="ellipsis-vertical"
                onClick={() => setShowMenu(!showMenu)}
              />
            </div>
            {showMenu ? (
              <div className="dropdown-menu" role="menu">
                <div className={`dropdown-content ${styles.menu}`}>
                  <div className="dropdown-item">
                    <Button className="is-ghost" onClick={openEditDialog}>
                      <FormattedMessage {...messages.edit} />
                    </Button>
                  </div>
                  <div className="dropdown-item">
                    <Button className="is-ghost" onClick={onDeleteTrainingBlock}>
                      <FormattedMessage {...messages.deleteBlock} />
                    </Button>
                  </div>
                  <TrainingBlockModal
                    defaultValues={blockDefaultValues}
                    errorMessage={<FormattedMessage {...messages.errorEditBlock} />}
                    isActive={active}
                    modalTitle={<FormattedMessage {...messages.editTrainingBlock} />}
                    onClose={closeEditDialog}
                    onSubmit={onEditTrainingBlock}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="title is-size-5">{title}</div>
        <div className="list">
          <ul>
            {linkToDocumentation ? (
              <div className="list-item">
                <li>
                  <Link to={linkToDocumentation}>
                    <span className="icon-text is-size-5">
                      <Icon className="mr-2" color="primary" icon="chevron-right" />
                      <FormattedMessage {...messages.linkToDocumentation} />
                    </span>
                  </Link>
                </li>
              </div>
            ) : null}
            {linkToVideo ? (
              <div className="list-item">
                <li>
                  <Link to={linkToVideo}>
                    <span className="icon-text is-size-5">
                      <Icon className="mr-2" color="primary" icon="circle-play" />
                      <FormattedMessage {...messages.video} />
                    </span>
                  </Link>
                </li>
              </div>
            ) : null}
            {exampleCode ? (
              <div className="list-item">
                <li>
                  <div>
                    <Button
                      className="is-ghost"
                      onClick={() => {
                        copyToClipboard(exampleCode);
                      }}
                    >
                      <span className="icon-text is-size-5">
                        <Icon className="mr-2" color="primary" icon="clipboard" />
                        <FormattedMessage {...messages.exampleCode} />
                      </span>
                    </Button>
                  </div>
                </li>
              </div>
            ) : null}
            {externalResource ? (
              <div className="list-item">
                <li>
                  <Link to={externalResource}>
                    <span className="icon-text is-size-5">
                      <Icon className="mr-2" color="primary" icon="chevron-right" />
                      <FormattedMessage {...messages.externalResource} />
                    </span>
                  </Link>
                </li>
              </div>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
