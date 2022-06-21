import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  title: 'Assets',
  uploadButton: 'Upload new asset',
  deleteButton: 'Delete {amount} {amount, plural, one {asset} other {assets}}',
  id: 'Id',
  resource: 'Resource',
  mime: 'File type',
  filename: 'Filename',
  name: 'Name',
  nameDescription:
    'If a name is set, the asset may be referenced by this name in addition to its ID.',
  actions: 'Actions',
  preview: 'Preview',
  cancel: 'Cancel',
  delete: 'Delete',
  deleteWarningTitle: 'Deleting {amount} {amount, plural, one {asset} other {assets}}',
  deleteWarning:
    'Are you sure you want to delete {amount} {amount, plural, one {asset} other {assets}}? This action cannot be reverted.',
  deleteSuccess: 'Successfully deleted {amount, plural, one {asset} other {assets}} {assets}',
  upload: 'Upload',
  uploadTitle: 'Upload new asset',
  file: 'File',
  chooseFile: 'Choose file…',
  noFile: 'No file chosen',
  uploadSuccess: 'Successfully uploaded asset {id}',
  uploadError: 'There as a problem uploading the asset. Please try again.',
  error: 'Something went wrong when fetching this app’s assets.',
  loading: 'Assets are being loaded…',
  empty: 'This app currently has no assets.',
});
