import App from './App';


export default process.env.NODE_ENV === 'production' ? App : require('react-hot-loader').hot(module)(App);
