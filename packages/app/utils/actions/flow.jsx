// See Page.jsx
export function next({ flowActions }) {
  return {
    dispatch(data) {
      return flowActions.next(data);
    },
  };
}

export function back({ flowActions }) {
  return {
    dispatch(data) {
      return flowActions.back(data);
    },
  };
}

export function skip({ flowActions }) {
  return {
    dispatch(data) {
      return flowActions.skip(data);
    },
  };
}

export default { next, back, skip };
