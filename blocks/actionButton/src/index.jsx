import { bootstrap } from '../../../sdk';
import './index.css';


bootstrap((shadow) => {
  // eslint-disable-next-line react/button-has-type
  const button = document.createElement('button');
  button.type = 'button';
  shadow.appendChild(button);
});
