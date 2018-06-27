import { bootstrap } from '../../../sdk';


bootstrap(({ shadowRoot }) => {
  const span = document.createElement('span');
  span.innerText = 'Stub';
  shadowRoot.appendChild(span);
});
