import { defineMessages } from 'react-intl';

export default defineMessages({
  deleteWarningTitle: 'Delete warning',
  deleteWarning: 'Are you sure you want to delete {blockname} from {pagename}?',
  deletePageWarning:
    '"{blockname}" is the final block in page: "{pagename}". Deleting this block will also delete the entire page.',
  delete: 'Delete',
  deletePage: 'Delete Page',
  cancel: 'Cancel',
});
