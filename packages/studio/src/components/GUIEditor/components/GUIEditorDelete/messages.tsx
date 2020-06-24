import { defineMessages } from 'react-intl';

export default defineMessages({
  deleteWarningTitle: 'Delete warning',
  deleteWarning: 'Are you sure you want to delete {blockName} from {pageName}?',
  deleteSubBlockWarning: 'Are you sure you want to delete subblock {blockName}?',
  deletePageWarning:
    '"{blockName}" is the final block in page: "{pageName}". Deleting this block will also delete the page to avoid errors.',
  deleteBlock: 'Delete {blockName}',
  delete: 'Delete',
  deletePage: 'Delete Page',
  cancel: 'Cancel',
});
