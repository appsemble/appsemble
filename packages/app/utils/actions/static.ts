import { ActionCreator } from '.';

export const staticAction: ActionCreator<'static'> = ({ definition: { value } }) => [() => value];
