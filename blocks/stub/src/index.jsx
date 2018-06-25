import { bootstrap } from '../../../sdk';


bootstrap((shadow) => {
  const span = document.createElement('span');
  span.innerText = 'Stub';
  shadow.appendChild(span);
});
