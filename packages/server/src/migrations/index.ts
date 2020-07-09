import type { Migration } from '../utils/migrate';
import m1 from './0.9.0';
import m2 from './0.9.3';
import m3 from './0.9.4';
import m4 from './0.10.0';
import m5 from './0.11.0';
import m6 from './0.11.3';
import m7 from './0.12.4';
import m8 from './0.12.6';
import m9 from './0.13.0';
import m10 from './0.13.1';
import m11 from './0.13.2';
import m12 from './0.13.3';
import m13 from './0.13.5';
import m14 from './0.13.6';

export default [m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14] as Migration[];
