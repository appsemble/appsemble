import faPkg from '@fortawesome/fontawesome-free/package.json' assert { type: 'json' };
import bulmaPkg from 'bulma/package.json' assert { type: 'json' };

import pkg from './package.json' assert { type: 'json' };

export const { version } = pkg;
export const faVersion = faPkg.version;
export const bulmaVersion = bulmaPkg.version;
