// See Page.jsx
function next({ flowActions }) {
  return {
    dispatch(data) {
      return flowActions.next(data);
    },
  };
}

function back({ flowActions }) {
  return {
    dispatch(data) {
      return flowActions.back(data);
    },
  };
}

function skip({ flowActions }) {
  return {
    dispatch(data) {
      return flowActions.skip(data);
    },
  };
}

export default { next, back, skip };
