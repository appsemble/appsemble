import { bootstrap } from '@appsemble/sdk';


bootstrap(({ shadowRoot }) => {
  const span = document.createElement('span');
  span.innerText = 'Stub';
  shadowRoot.appendChild(span);
});
