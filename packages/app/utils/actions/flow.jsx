// See Page.jsx
function next({ flowActions }) {
  return {
    async dispatch(data) {
      return flowActions.next(data);
    },
  };
}

function back({ flowActions }) {
  return {
    async dispatch(data) {
      return flowActions.back(data);
    },
  };
}

function skip({ flowActions }) {
  return {
    async dispatch(data) {
      return flowActions.skip(data);
    },
  };
}

export default { next, back, skip };
