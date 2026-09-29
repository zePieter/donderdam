import {writeFileSync} from 'node:fs';
import {readOutput} from '../lib/ai.js';
import {flatRows} from '../lib/api.js';
const records=readOutput().records;
for(const flavor of ['insights','deep-dives','recommendations'])writeFileSync(new URL('../data/ai-'+flavor+'.json',import.meta.url),JSON.stringify(flatRows(records,flavor),null,2));
console.log(`${records.length} echte AI-contexten geëxporteerd voor gebruik zonder server.`);
