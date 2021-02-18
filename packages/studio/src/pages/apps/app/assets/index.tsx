import {
  Button,
  CardFooterButton,
  Checkbox,
  Content,
  FileUpload,
  Loader,
  Message,
  Modal,
  Table,
  Title,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import axios from 'axios';
import { extension } from 'mime-types';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { download } from 'studio/src/utils/download';

import { useApp } from '..';
import { AssetPreview } from './AssetPreview';
import styles from './index.module.css';
import { messages } from './messages';

export interface Asset {
  id: string;
  mime: string;
  filename: string;
}

export function AssetsPage(): ReactElement {
  useMeta(messages.title);

  const { app } = useApp();
  const { formatMessage } = useIntl();
  const push = useMessages();

  const { data: assets, error, loading, setData: setAssets } = useData<Asset[]>(
    `/api/apps/${app.id}/assets`,
  );
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [dialog, setDialog] = useState<'preview' | 'upload'>(null);
  const [previewedAsset, setPreviewedAsset] = useState<Asset>(null);
  const [file, setFile] = useState<File>();

  const onClose = useCallback(() => {
    setDialog(null);
    setPreviewedAsset(null);
  }, []);

  const onUploadClick = useCallback(() => {
    setDialog('upload');
  }, []);

  const onUpload = useCallback(async () => {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const { data } = await axios.post(`/api/apps/${app.id}/assets`, file, {
      headers: { 'content-type': file.type },
    });

    push({ color: 'success', body: formatMessage(messages.uploadSuccess, { id: data.id }) });

    setAssets([...assets, data]);
    setFile(null);
    onClose();
  }, [app, assets, file, formatMessage, onClose, push, setAssets]);

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
          assets: selectedAssets.sort().join(', '),
        }),
        color: 'info',
      });
      setAssets(assets.filter((asset) => !selectedAssets.includes(String(asset.id))));
      setSelectedAssets([]);
    },
  });

  const onPreviewClick = useCallback((asset: Asset) => {
    setPreviewedAsset(asset);
    setDialog('preview');
  }, []);

  const downloadAsset = useCallback(
    async (asset) => {
      try {
        const { filename, id } = asset;
        const mime = extension(asset.mime);

        await download(`/api/apps/${app.id}/assets/${id}`, filename || mime ? `${id}.${mime}` : id);
      } catch {
        push(formatMessage(messages.downloadError));
      }
    },
    [app, formatMessage, push],
  );

  const onAssetCheckboxClick = useCallback(
    (event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const id = event.currentTarget.name.replace(/^asset/, '');

      if (checked) {
        setSelectedAssets([...selectedAssets, id]);
      } else {
        setSelectedAssets(selectedAssets.filter((a) => a !== id));
      }
    },
    [selectedAssets],
  );

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  if (loading) {
    return <Loader />;
  }

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
            <tr key={asset.id}>
              <td>
                <Checkbox
                  checked={selectedAssets.includes(asset.id)}
                  className="is-inline-block mt-2"
                  name={`asset${asset.id}`}
                  onChange={onAssetCheckboxClick}
                />
                <Button color="primary" icon="download" onClick={() => downloadAsset(asset)} />
              </td>
              <td>{asset.id}</td>
              <td>{asset.mime}</td>
              <td>{asset.filename}</td>
              <td>
                <Button onClick={() => onPreviewClick(asset)}>
                  <FormattedMessage {...messages.preview} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal
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
      </Modal>
      <Modal
        isActive={dialog === 'preview'}
        onClose={onClose}
        title={<FormattedMessage {...messages.preview} />}
      >
        <AssetPreview asset={previewedAsset} />
      </Modal>
    </>
  );
}
