import faPkg from '@fortawesome/fontawesome-free/package.json' assert { type: 'json' };
import bulmaPkg from 'bulma/package.json' assert { type: 'json' };

export const bulmaURL = `/bulma/${bulmaPkg.version}/bulma.min.css`;
export const faURL = `/fa/${faPkg.version}/css/all.min.css`;
