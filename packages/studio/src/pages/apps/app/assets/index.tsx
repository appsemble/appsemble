import {
  Button,
  CardFooterButton,
  Checkbox,
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
import { compareStrings } from '@appsemble/utils';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useApp } from '..';
import { AsyncDataView } from '../../../../components/AsyncDataView';
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

  const assetsResult = useData<Asset[]>(`/api/apps/${app.id}/assets`);
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

  const onPreviewClick = useCallback((asset: Asset) => {
    setPreviewedAsset(asset);
    setDialog('preview');
  }, []);

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
                <tr key={asset.id}>
                  <td>
                    <Checkbox
                      checked={selectedAssets.includes(asset.id)}
                      className="is-inline-block mt-2"
                      name={`asset${asset.id}`}
                      onChange={onAssetCheckboxClick}
                    />
                    <Button
                      color="primary"
                      component="a"
                      download
                      href={`/api/apps/${app.id}/assets/${asset.id}`}
                      icon="download"
                    />
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
      <ModalCard
        isActive={dialog === 'preview'}
        onClose={onClose}
        title={<FormattedMessage {...messages.preview} />}
      >
        <AssetPreview asset={previewedAsset} />
      </ModalCard>
    </>
  );
}
