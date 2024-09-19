import { type ActionCreator } from './index.js';

export const groupQuery: ActionCreator<'group.query'> = ({ appMemberGroups }) => [
  () => appMemberGroups,
];
