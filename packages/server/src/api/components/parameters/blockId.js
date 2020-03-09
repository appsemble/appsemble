import { normalized } from '@appsemble/utils';

export default {
  name: 'blockId',
  in: 'path',
  description:
    'The ID of the block on which to perform an operation, but without the organization scope.',
  required: true,
  schema: {
    type: 'string',
    pattern: normalized,
  },
};
