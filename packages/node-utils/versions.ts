import faPkg from '@fortawesome/fontawesome-free/package.json' with { type: 'json' };
import bulmaPkg from 'bulma/package.json' with { type: 'json' };

import pkg from './package.json' with { type: 'json' };

export const { version } = pkg;
export const faVersion = faPkg.version;
export const bulmaVersion = bulmaPkg.version;
