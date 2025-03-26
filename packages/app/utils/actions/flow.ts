import { type ActionCreator } from './index.js';

// See Page.jsx
export const next: ActionCreator<'flow.next'> = ({ flowActions }) => [
  (data) => flowActions?.next(data),
];

export const finish: ActionCreator<'flow.finish'> = ({ flowActions }) => [
  (data) => flowActions?.finish(data),
];

export const back: ActionCreator<'flow.back'> = ({ flowActions }) => [
  (data) => flowActions?.back(data),
];

export const cancel: ActionCreator<'flow.cancel'> = ({ flowActions }) => [
  (data) => flowActions?.cancel(data),
];

export const to: ActionCreator<'flow.to'> = ({ definition, flowActions, remap }) => [
  (data, context) => flowActions?.to(data, remap(definition.step, data, context)),
];
