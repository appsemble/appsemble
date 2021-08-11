import {
  Button,
  CardFooterButton,
  Content,
  FileUpload,
  ModalCard,
  Table,
  Title,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import { Asset } from '@appsemble/types';
import { compareStrings } from '@appsemble/utils';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '..';
import { AsyncDataView } from '../../../../components/AsyncDataView';
import { AssetRow } from './AssetRow';
import styles from './index.module.css';
import { messages } from './messages';

export function AssetsPage(): ReactElement {
  useMeta(messages.title);

  const { app } = useApp();
  const { formatMessage } = useIntl();
  const push = useMessages();

  const assetsResult = useData<Asset[]>(`/api/apps/${app.id}/assets`);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [dialog, setDialog] = useState<'upload'>(null);
  const [file, setFile] = useState<File>();

  const onClose = useCallback(() => {
    setDialog(null);
  }, []);

  const onUploadClick = useCallback(() => {
    setDialog('upload');
  }, []);

  const { setData } = assetsResult;

  const onUpload = useCallback(async () => {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const { data } = await axios.post(`/api/apps/${app.id}/assets`, file, {
      headers: { 'content-type': file.type },
    });

    push({ color: 'success', body: formatMessage(messages.uploadSuccess, { id: data.id }) });

    setData((assets) => [...assets, data]);
    setFile(null);
    onClose();
  }, [app.id, setData, file, formatMessage, onClose, push]);

  const onFileChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
    setFile(e.currentTarget.files[0]);
  }, []);

  const onDelete = useConfirmation({
    title: (
      <FormattedMessage
        {...messages.deleteWarningTitle}
        values={{ amount: selectedAssets.length }}
      />
    ),
    body: (
      <FormattedMessage values={{ amount: selectedAssets.length }} {...messages.deleteWarning} />
    ),
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    async action() {
      await Promise.all(
        selectedAssets.map((asset) => axios.delete(`/api/apps/${app.id}/assets/${asset}`)),
      );

      push({
        body: formatMessage(messages.deleteSuccess, {
          amount: selectedAssets.length,
          assets: selectedAssets.sort(compareStrings).join(', '),
        }),
        color: 'info',
      });
      setData((assets) => assets.filter((asset) => !selectedAssets.includes(String(asset.id))));
      setSelectedAssets([]);
    },
  });

  const onAssetCheckboxClick = useCallback(
    (event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const id = event.currentTarget.name.replace(/^asset/, '');

      setSelectedAssets((assets) => (checked ? [...assets, id] : assets.filter((a) => a !== id)));
    },
    [],
  );

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="buttons">
        <Button color="primary" icon="upload" onClick={onUploadClick}>
          <FormattedMessage {...messages.uploadButton} />
        </Button>
        <Button
          color="danger"
          disabled={selectedAssets.length === 0}
          icon="trash-alt"
          onClick={onDelete}
        >
          <FormattedMessage {...messages.deleteButton} values={{ amount: selectedAssets.length }} />
        </Button>
      </div>
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.empty} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={assetsResult}
      >
        {(assets) => (
          <Table>
            <thead>
              <tr>
                <th>
                  <FormattedMessage {...messages.actions} />
                </th>
                <th>
                  <FormattedMessage {...messages.id} />
                </th>
                <th>
                  <FormattedMessage {...messages.mime} />
                </th>
                <th>
                  <FormattedMessage {...messages.filename} />
                </th>
                <th>
                  <FormattedMessage {...messages.preview} />
                </th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <AssetRow
                  asset={asset}
                  isSelected={selectedAssets.includes(asset.id)}
                  key={asset.id}
                  onSelect={onAssetCheckboxClick}
                />
              ))}
            </tbody>
          </Table>
        )}
      </AsyncDataView>
      <ModalCard
        footer={
          <>
            <CardFooterButton onClick={onClose}>
              <FormattedMessage {...messages.cancel} />
            </CardFooterButton>
            <CardFooterButton color="primary" onClick={onUpload}>
              <FormattedMessage {...messages.upload} />
            </CardFooterButton>
          </>
        }
        isActive={dialog === 'upload'}
        onClose={onClose}
        title={<FormattedMessage {...messages.uploadTitle} />}
      >
        <Content>
          <FileUpload
            className={`${styles.filePicker} has-text-centered`}
            fileButtonLabel={<FormattedMessage {...messages.chooseFile} />}
            fileLabel={file?.name || <FormattedMessage {...messages.noFile} />}
            formComponentClassName="has-text-centered"
            label={<FormattedMessage {...messages.file} />}
            name="file"
            onChange={onFileChange}
            required
          />
        </Content>
      </ModalCard>
    </>
  );
}
