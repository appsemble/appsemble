import { defineMessages } from 'react-intl';

export const messages = defineMessages({
  cancelCreateWarningTitle: {
    id: 'studio.qjYNH9',
    defaultMessage: 'You have an unsaved resource',
  },
  cancelCreateWarningMessage: {
    id: 'studio.pDN/hZ',
    defaultMessage:
      'Are you sure you want to cancel creating this resource? This will discard all inputs!',
  },
  unsavedUpdateChangesWarningTitle: {
    id: 'studio.u4L4yd',
    defaultMessage: 'You have unsaved changes',
  },
  unsavedUpdateChangesWarningMessage: {
    id: 'studio.QHAXqK',
    defaultMessage:
      'Are you sure you want to cancel updating the `{resourceName}` resource? This will discard all unsaved changes!',
  },
  confirmChoice: {
    id: 'studio.a5msuh',
    defaultMessage: 'Yes',
  },
  cancelChoice: {
    id: 'studio.oUWADl',
    defaultMessage: 'No',
  },
  resourceNameHelp: {
    id: 'studio.3XLqnb',
    defaultMessage: 'This will be the name of your newly created resource',
  },
  creatingResource: {
    id: 'studio.C4p5Qq',
    defaultMessage: 'Creating resource',
  },
  updatingResource: {
    id: 'studio.VHOLD3',
    defaultMessage: 'Updating resource',
  },
  resourceName: {
    id: 'studio.fCCf9N',
    defaultMessage: 'Resource Name',
  },
  fields: {
    id: 'studio.iJMNSQ',
    defaultMessage: 'Fields',
  },
  security: {
    id: 'studio.Py189G',
    defaultMessage: 'Security',
  },
  properties: {
    id: 'studio.aI80kg',
    defaultMessage: 'Properties',
  },
  systemFieldMessage: {
    id: 'studio.z2YelC',
    defaultMessage:
      'System fields are fields that are automaticaly created with every new resource in Appsemble.',
  },
  removeField: {
    id: 'studio.MVeTei',
    defaultMessage: 'Remove Field',
  },
  newField: {
    id: 'studio.gZD+CR',
    defaultMessage: 'Add a new Field',
  },
  fieldName: {
    id: 'studio.TML/L4',
    defaultMessage: 'Field Name',
  },
  fieldProperties: {
    id: 'studio.MFG1+P',
    defaultMessage: 'Field properties',
  },
  defaultValueSelect: {
    id: 'studio.9sJPOX',
    defaultMessage: 'Select a resource type to add',
  },
  booleanInfo: {
    id: 'studio.ju3jtF',
    defaultMessage:
      'A Boolean is a variable that can have one of two possible values, true or false',
  },
  integerInfo: {
    id: 'studio.M2yTxd',
    defaultMessage:
      'An integer is a number which is not a fraction; a whole number (..., -2, -1, 0, 1, 2, 3, ...)',
  },
  numberInfo: {
    /* Cspell:disable-next-line */
    id: 'studio.KWdahu',
    defaultMessage: 'Number can contain a fractional part (2.56, 1.24, 7E-10) and also integers',
  },
  stringInfo: {
    id: 'studio.FfObOV',
    defaultMessage:
      'A string is any sequence of characters (letters, numerals, symbols, punctuation marks, etc.)',
  },
  relationship: {
    id: 'studio./OEORY',
    defaultMessage: 'Relationship',
  },
  roles: {
    id: 'studio.c35gM5',
    defaultMessage: 'Roles',
  },
  roleInfo: {
    id: 'studio.iu9iYI',
    defaultMessage: 'The default roles that are allowed to perform all actions.',
  },
  noneRoleInfo: {
    id: 'studio.gXcR1Y',
    defaultMessage: 'Grants access specifically to users who aren’t logged in.',
  },
  publicRoleInfo: {
    id: 'studio.dujvfw',
    defaultMessage: 'Grants access to everyone, even users who aren’t logged in.',
  },
  authorRoleInfo: {
    id: 'studio.8b9Mkg',
    defaultMessage: 'Grants access if the user is the same as the one who created the resource.',
  },
  teamMemberRoleInfo: {
    id: 'studio.z1iBkr',
    defaultMessage:
      'Grants access if the user is in the same team as the user who created the resource.',
  },
  teamManagerRoleInfo: {
    id: 'studio.tOoKCv',
    defaultMessage:
      'Grants access if the user is in the same team as the user who created the resource and has the manager role within the team.',
  },
  expiresInfo: {
    id: 'studio.bmwyz0',
    defaultMessage: 'A time string representing when a resource should expire.',
  },
  expires: {
    id: 'studio.xhQMeQ',
    defaultMessage: 'Expires',
  },
  clonable: {
    id: 'studio.4xEqDf',
    defaultMessage: 'Clonable',
  },
  futureUpdateInfo: {
    id: 'studio.22sXgw',
    defaultMessage:
      'Support for external resources, history and views will be added in the future.',
  },
  cancel: {
    id: 'studio.47FYwb',
    defaultMessage: 'Cancel',
  },
  update: {
    id: 'studio.BWpuKl',
    defaultMessage: 'Update',
  },
  create: {
    id: 'studio.VzzYJk',
    defaultMessage: 'Create',
  },
  maximumLenght: {
    id: 'studio.EVa8ST',
    defaultMessage: 'Maximum Length',
  },
  minimumLenght: {
    id: 'studio.WGj64n',
    defaultMessage: 'Minimum Length',
  },
  maximum: {
    id: 'studio.BCzmdv',
    defaultMessage: 'Maximum',
  },
  minimum: {
    id: 'studio.Amt/8b',
    defaultMessage: 'Minimum',
  },
  required: {
    id: 'studio.Seanpx',
    defaultMessage: 'Required',
  },
  delete: {
    id: 'studio.K3r6DQ',
    defaultMessage: 'Delete',
  },
  relatedResource: {
    id: 'studio.QMUvie',
    defaultMessage: 'Related Resource',
  },
  selectRelatedResource: {
    id: 'studio.+nW2YO',
    defaultMessage: 'Select Related Resource',
  },
  deletionWarning: {
    id: 'studio.bEmJ9Y',
    defaultMessage: 'Deletion Warning',
  },
  deletionWarningMessage: {
    id: 'studio.il/JE4',
    defaultMessage:
      'Are you sure you want to delete the `{resourceName}` resource? Deleted resources can not be recovered.',
  },
  updateWarning: {
    id: 'studio.XREHho',
    defaultMessage: 'Resource Warning',
  },
  UpdateWarningMessage: {
    id: 'studio.fPH9wE',
    defaultMessage:
      'Are you sure you want to update the `{resourceName}` resource? Updating resources may resoult in data loss and can not be recovered.',
  },
  createNewResource: {
    id: 'studio.CdKOL0',
    defaultMessage: 'Create new resource',
  },
  openErd: {
    id: 'studio.Smajh0',
    defaultMessage: 'Show Relationship Diagram',
  },
  closeErd: {
    id: 'studio.7LZ4pL',
    defaultMessage: 'Close Diagram',
  },
});
