const GET_START = 'app/GET_START';
const GET_SUCCESS = 'app/GET_SUCCESS';
const GET_ERROR = 'app/GET_ERROR';

const initialState = null;

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_START:
      return null;
    case GET_SUCCESS:
      return action.db;
    case GET_ERROR:
      return null;
    default:
      return state;
  }
};
