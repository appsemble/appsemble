import { defineMessages } from 'react-intl';

export default defineMessages({
  deleteWarningTitle: 'Delete warning',
  deleteWarning: 'Are you sure you want to delete {blockname} from {pagename}?',
  deleteSubBlockWarning: 'Are you sure you want to delete subblock {blockname}?',
  deletePageWarning:
    '"{blockname}" is the final block in page: "{pagename}". Deleting this block will also delete the page to avoid errors.',
  deleteBlock: 'Delete {name}',
  delete: 'Delete',
  deletePage: 'Delete Page',
  cancel: 'Cancel',
});
