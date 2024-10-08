import {
  Button,
  CardFooterButton,
  FileUpload,
  ModalCard,
  useObjectURL,
  useToggle,
} from '@appsemble/react-components';
import { OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { AppScreenshot } from './AppScreenshot/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';
import { useUser } from '../../../../../components/UserProvider/index.js';
import { useApp } from '../../index.js';

export function AppScreenshots(): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const { app, setApp } = useApp();
  const { organizations } = useUser();
  const { formatMessage } = useIntl();

  const screenshotModal = useToggle();
  const [uploadingScreenshot, setUploadingScreenshot] = useState<File>();
  const uploadingScreenshotPreview = useObjectURL(uploadingScreenshot);

  const userRole = organizations?.find((org) => org.id === app.OrganizationId)?.role;
  const mayCreateScreenshots =
    userRole &&
    checkOrganizationRoleOrganizationPermissions(userRole, [
      OrganizationPermission.CreateAppScreenshots,
    ]);

  const screenshotDiv = useRef<HTMLDivElement>();
  const scrollScreenshots = useCallback((reverse = false) => {
    if (!screenshotDiv.current) {
      return;
    }

    screenshotDiv.current.scrollLeft += reverse ? -255 : 255;
  }, []);
  const scrollRight = useCallback(() => {
    scrollScreenshots();
  }, [scrollScreenshots]);
  const scrollLeft = useCallback(() => {
    scrollScreenshots(true);
  }, [scrollScreenshots]);

  const onScreenshotChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setUploadingScreenshot(event.currentTarget.files[0]);
  }, []);

  const closeModal = useCallback(() => {
    screenshotModal.disable();
    setUploadingScreenshot(null);
  }, [screenshotModal]);

  const onSubmitScreenshot = useCallback(async () => {
    const form = new FormData();
    form.append('screenshots', uploadingScreenshot, uploadingScreenshot.name);
    form.append('language', lang);
    const { data: ids } = await axios.post<number[]>(`/api/apps/${app.id}/screenshots`, form);
    setApp({
      ...app,
      screenshotUrls: [
        ...app.screenshotUrls,
        ...ids.map((id) => `/api/apps/${app.id}/screenshots/${id}`),
      ],
    });
    closeModal();
  }, [uploadingScreenshot, app, lang, setApp, closeModal]);

  if (!mayCreateScreenshots && !app.screenshotUrls.length) {
    return null;
  }

  return (
    <>
      <div className={`has-background-white-ter is-flex ${styles.wrapper}`}>
        {mayCreateScreenshots ? (
          <Button
            className={`my-2 mr-5 ${styles.createScreenshotButton}`}
            onClick={screenshotModal.enable}
          >
            <FormattedMessage {...messages.addNewScreenshot} />
          </Button>
        ) : null}
        {app.screenshotUrls.length !== 0 && (
          <div className="my-4 is-flex gap-1">
            <Button
              className={`is-medium ${styles.scrollButton}`}
              icon="chevron-left"
              onClick={scrollLeft}
            />
            <div className={`px-4 ${styles.screenshots}`} ref={screenshotDiv}>
              {app.screenshotUrls.map((url) => (
                <AppScreenshot key={url} url={url} />
              ))}
            </div>
            <Button
              className={`is-medium ${styles.scrollButton}`}
              icon="chevron-right"
              onClick={scrollRight}
            />
          </div>
        )}
      </div>
      <ModalCard
        footer={
          <>
            <CardFooterButton onClick={closeModal}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton
              color="primary"
              disabled={!uploadingScreenshot}
              onClick={onSubmitScreenshot}
            >
              <FormattedMessage {...messages.submit} />
            </CardFooterButton>
          </>
        }
        isActive={screenshotModal.enabled}
        onClose={closeModal}
        title={<FormattedMessage {...messages.submit} />}
      >
        <FileUpload
          accept="image/jpeg, image/png, image/tiff, image/webp"
          fileButtonLabel={<FormattedMessage {...messages.screenshot} />}
          fileLabel={uploadingScreenshot?.name ?? <FormattedMessage {...messages.noFile} />}
          label={<FormattedMessage {...messages.screenshot} />}
          name="screenshot"
          onChange={onScreenshotChange}
          preview={
            uploadingScreenshot ? (
              <figure className={`mb-2 ${styles.screenshotPreview}`}>
                <img
                  alt={formatMessage(messages.screenshot)}
                  className={styles.screenshotPreview}
                  src={uploadingScreenshotPreview}
                />
              </figure>
            ) : null
          }
          required
        />
      </ModalCard>
    </>
  );
}
