// See Page.jsx
function next({ flowActions }) {
  return {
    async dispatch(data) {
      return flowActions.next(data);
    },
  };
}

function finish({ flowActions }) {
  return {
    async dispatch(data) {
      return flowActions.finish(data);
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

function cancel({ flowActions }) {
  return {
    async dispatch(data) {
      return flowActions.cancel(data);
    },
  };
}

export default { next, finish, back, cancel };
