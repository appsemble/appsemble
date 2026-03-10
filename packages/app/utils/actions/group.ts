import { type ActionCreator } from './index.js';

export const groupQuery: ActionCreator<'group.query'> = ({ appMemberGroups }) => [
  () => appMemberGroups,
];

export const groupSelectedUpdate: ActionCreator<'group.selected.update'> = ({
  appMemberGroups,
  definition,
  remap,
  setAppMemberSelectedGroup,
}) => [
  (data) => {
    const groupId = remap(definition.groupId, data);

    if (groupId == null) {
      return setAppMemberSelectedGroup(null);
    }

    if (typeof groupId !== 'number') {
      throw new TypeError(
        `Expected groupId to be a number or null, got: ${JSON.stringify(groupId)}`,
      );
    }

    if (!appMemberGroups.some((group) => group.id === groupId)) {
      throw new Error(`Group with id ${groupId} was not found.`);
    }

    return setAppMemberSelectedGroup(groupId);
  },
];
