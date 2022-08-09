import { ActionCreator } from './index.js';

export const staticAction: ActionCreator<'static'> = ({ definition: { value } }) => [() => value];
