import { contexts } from '../lib/data.js';
import {generate,storeRecord,readOutput} from '../lib/ai.js';
try {
const args=process.argv.slice(2);
if(!process.env.GEMINI_API_KEY)throw new Error('Vul GEMINI_API_KEY in .env. Sleutel nooit in GitHub of Power BI zetten.');
if(process.env.GEMINI_FREE_TIER_CONFIRMED!=='true')throw new Error('Bevestig eerst plan Free in AI Studio en zet GEMINI_FREE_TIER_CONFIRMED=true.');
const all=contexts();
const wanted=args.includes('--all')?all:all.filter(c=>c.context_id===(args[0]??'2026-08_WON'));
if(!wanted.length)throw new Error('Onbekende context. Gebruik bijv. 2026-08_WON of --all.');
const existing=readOutput().records;
for(const c of wanted) {
  if(!args.includes('--force')&&existing.some(r=>r.context_id===c.context_id&&r.source_hash===c.source_hash)){console.log(`${c.context_id}: bestaande generatie behouden`);continue;}
  console.log(`${c.context_id}: echte Gemini-aanroep`);
  const {record}=await generate(c,{key:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL??'gemini-3.5-flash-lite'});
  storeRecord(record);
  console.log(`${c.context_id}: opgeslagen als concept (${record.model})`);
  if(wanted.length>1)await new Promise(r=>setTimeout(r,15000));
}
} catch(error) {console.error(error.message);process.exitCode=1;}
