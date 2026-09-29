// npm run generate -- --all        → juni t/m augustus 2026 (bestaande runs met dezelfde bron blijven staan)
// npm run generate -- 2026-09      → één maand, bijvoorbeeld live in de demo
// --force                          → bewust opnieuw genereren
import {loadData,context,aiMonths} from '../lib/data.js';
import {generate,storeRecord,readOutput} from '../lib/ai.js';
import {exportSnapshots} from '../lib/api.js';
try{
  const args=process.argv.slice(2);
  if(!process.env.GEMINI_API_KEY)throw new Error('Vul GEMINI_API_KEY in .env. Sleutel nooit in GitHub of Power BI zetten.');
  if(process.env.GEMINI_FREE_TIER_CONFIRMED!=='true')throw new Error('Bevestig eerst plan Free in AI Studio en zet GEMINI_FREE_TIER_CONFIRMED=true.');
  const months=args.includes('--all')?aiMonths:args.filter(a=>/^\d{4}-\d{2}$/.test(a)).map(a=>a+'-01');
  if(!months.length)throw new Error('Geef --all of een maand zoals 2026-09.');
  const data=loadData(),existing=readOutput().records;
  for(const [i,m] of months.entries()){
    const c=context(data,m);
    if(!args.includes('--force')&&existing.some(r=>r.context_id===c.context_id&&r.source_hash===c.source_hash)){console.log(`${c.context_id}: bestaande generatie behouden`);continue;}
    if(i>0)await new Promise(r=>setTimeout(r,12000));
    console.log(`${c.context_id}: Gemini kijkt naar ${JSON.stringify(c).length.toLocaleString('nl-NL')} tekens Donderdam-data…`);
    const record=await generate(c,{key:process.env.GEMINI_API_KEY,model:process.env.GEMINI_MODEL??'gemini-3.5-flash-lite',log:m=>console.log('  '+m)});
    storeRecord(record);
    const o=record.output;
    console.log(`${c.context_id}: opgeslagen (${record.model}, ${record.latency_ms} ms, poging ${record.attempt}) → ${o.signalen.length} signalen, ${o.wijkduidingen.length} wijkduidingen, ${o.aanbevelingen.length} aanbevelingen`);
  }
  exportSnapshots();
  console.log('Platte AI-bestanden bijgewerkt in data/.');
}catch(e){console.error(e.message);process.exitCode=1;}
