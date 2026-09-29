import {contexts} from '../lib/data.js';
import {writeFileSync,mkdirSync} from 'node:fs';
import {prompt,schema} from '../lib/ai.js';
mkdirSync(new URL('../prompts/',import.meta.url),{recursive:true});
for(const c of contexts())writeFileSync(new URL(`../prompts/${c.context_id}.json`,import.meta.url),JSON.stringify({instruction:prompt,response_schema:schema,data:c},null,2));
console.log('Negen controleerbare contexten opgeslagen in prompts/.');
