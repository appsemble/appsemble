import { ActionCreator } from '.';

// See Page.jsx
export const next: ActionCreator<'flow.next'> = ({ flowActions }) => [
  (data) => flowActions.next(data),
];

export const finish: ActionCreator<'flow.finish'> = ({ flowActions }) => [
  (data) => flowActions.finish(data),
];

export const back: ActionCreator<'flow.back'> = ({ flowActions }) => [
  (data) => flowActions.back(data),
];

export const cancel: ActionCreator<'flow.cancel'> = ({ flowActions }) => [
  (data) => flowActions.cancel(data),
];
