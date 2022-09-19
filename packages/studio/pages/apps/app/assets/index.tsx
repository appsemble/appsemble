import {
  Button,
  Checkbox,
  Content,
  FileUpload,
  ModalCard,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleModalFooter,
  Table,
  Title,
  useConfirmation,
  useData,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { PaginationNavigator } from '@appsemble/react-components/PaginationNavigator';
import { Asset } from '@appsemble/types';
import { compareStrings, normalize } from '@appsemble/utils';
import axios from 'axios';
import { ChangeEvent, ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { useApp } from '../index.js';
import { AssetRow } from './AssetRow/index.js';
import styles from './index.module.css';
import { messages } from './messages.js';

interface FormValues {
  file: File;
  name: string;
}

const defaultFormValues: FormValues = {
  file: undefined,
  name: '',
};

export function AssetsPage(): ReactElement {
  useMeta(messages.title);

  const { app } = useApp();
  const { formatMessage } = useIntl();
  const push = useMessages();

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(Number.POSITIVE_INFINITY);
  const [offset, setOffset] = useState(0);
  const { data: count, setData: setCount } = useData<number>(`/api/apps/${app.id}/assets/$count`);
  const assetsResult = useData<Asset[]>(
    `/api/apps/${app.id}/assets?$skip=${offset}${
      limit === Number.POSITIVE_INFINITY ? '' : `&$top=${limit}`
    }`,
  );
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const dialog = useToggle();

  const { setData } = assetsResult;

  const submitAsset = useCallback(
    async ({ file, name }: FormValues) => {
      const formData = new FormData();
      formData.append('file', file);
      if (name) {
        formData.append('name', normalize(name));
      }
      const { data } = await axios.post<Asset>(`/api/apps/${app.id}/assets`, formData);

      push({ color: 'success', body: formatMessage(messages.uploadSuccess, { id: data.id }) });

      setData((assets) => [...assets, data]);
      setCount((c) => c + 1);
      assetsResult.refresh();
      dialog.disable();
    },
    [app.id, assetsResult, dialog, formatMessage, push, setCount, setData],
  );

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
    color: 'danger',
    async action() {
      await axios.delete(`/api/apps/${app.id}/assets`, { data: selectedAssets });

      push({
        body: formatMessage(messages.deleteSuccess, {
          amount: selectedAssets.length,
          assets: selectedAssets.sort(compareStrings).join(', '),
        }),
        color: 'info',
      });
      setData((assets) => assets.filter((asset) => !selectedAssets.includes(String(asset.id))));
      setSelectedAssets([]);
      setCount((c) => c - selectedAssets.length);
      assetsResult.refresh();
    },
  });

  const onAssetCheckboxClick = useCallback(
    (event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
      const id = event.currentTarget.name.replace(/^asset/, '');

      setSelectedAssets((assets) => (checked ? [...assets, id] : assets.filter((a) => a !== id)));
    },
    [],
  );

  const onSelectAll = useCallback(() => {
    setSelectedAssets((selected) =>
      selected.length === assetsResult.data?.length
        ? []
        : assetsResult.data.map((asset) => asset.id),
    );
  }, [assetsResult]);

  const onPageChange = useCallback((updatedPage: number) => {
    setSelectedAssets([]);
    setPage(updatedPage);
  }, []);

  const onRowsPerPageChange = useCallback((updatedRowsPerPage: number) => {
    setSelectedAssets([]);
    setRowsPerPage(updatedRowsPerPage);
  }, []);

  useEffect(() => {
    const newPage =
      rowsPerPage === Number.POSITIVE_INFINITY
        ? 1
        : page >= Math.ceil(count / rowsPerPage)
        ? Math.ceil(count / rowsPerPage)
        : page;
    setPage(newPage <= 0 ? 1 : newPage);
    setLimit(rowsPerPage === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : rowsPerPage);
    setOffset(rowsPerPage === Number.POSITIVE_INFINITY ? 0 : (page - 1) * rowsPerPage);
  }, [assetsResult, page, rowsPerPage, count]);

  return (
    <>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="buttons">
        <Button color="primary" icon="upload" onClick={dialog.enable}>
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
          <>
            <Table>
              <thead>
                <tr>
                  <th>
                    <Checkbox
                      className={`pr-2 is-inline-block ${styles.boolean} `}
                      indeterminate={
                        selectedAssets.length
                          ? selectedAssets.length !== assetsResult.data?.length
                          : null
                      }
                      name="select-all"
                      onChange={onSelectAll}
                      value={selectedAssets.length === assetsResult.data?.length}
                    />
                    <span className="is-inline-block">
                      <FormattedMessage {...messages.actions} />
                    </span>
                  </th>
                  <th>
                    <FormattedMessage {...messages.id} />
                  </th>
                  <th>
                    <FormattedMessage {...messages.resource} />
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
            <PaginationNavigator
              count={count}
              onPageChange={onPageChange}
              onRowsPerPageChange={onRowsPerPageChange}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[10, 25, 100, 500, Number.POSITIVE_INFINITY]}
            />
          </>
        )}
      </AsyncDataView>
      <ModalCard
        component={SimpleForm}
        defaultValues={defaultFormValues}
        footer={
          <SimpleModalFooter
            cancelLabel={<FormattedMessage {...messages.cancel} />}
            onClose={dialog.disable}
            submitLabel={<FormattedMessage {...messages.upload} />}
          />
        }
        isActive={dialog.enabled}
        onClose={dialog.disable}
        onSubmit={submitAsset}
        resetOnSuccess
        title={<FormattedMessage {...messages.uploadTitle} />}
      >
        <Content>
          <SimpleFormError>{() => <FormattedMessage {...messages.uploadError} />}</SimpleFormError>
          <SimpleFormField
            className={`${styles.filePicker} has-text-centered`}
            component={FileUpload}
            fileButtonLabel={<FormattedMessage {...messages.chooseFile} />}
            fileLabel={<FormattedMessage {...messages.noFile} />}
            formComponentClassName="has-text-centered"
            label={<FormattedMessage {...messages.file} />}
            name="file"
            required
          />
          <SimpleFormField
            addonLeft={
              <label className="button is-static" htmlFor="name">
                /api/apps/{app.id}/assets/
              </label>
            }
            help={<FormattedMessage {...messages.nameDescription} />}
            label={<FormattedMessage {...messages.name} />}
            name="name"
            preprocess={(value) => normalize(value, false)}
          />
        </Content>
      </ModalCard>
    </>
  );
}
