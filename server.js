import http from 'node:http';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {loadData,contexts,sourceNames} from './lib/data.js';
import {readOutput} from './lib/ai.js';

// Gemini herhaalt soms het veld missing_data achter de hypothese; in de platte tabel staat het al apart.
const stripMissing=(h,m)=>{const i=h.search(/\s*(?:Ontbrekende (?:gegevens|data)|Missing data):/i);return i>0&&m&&h.slice(i).includes(m.slice(0,30))?h.slice(0,i).trim():h;};
export function flatRows(records,flavor) {
  return records.flatMap(r=>{
    const common={Context_ID:r.context_id,Peilmaand:r.peilmaand,KPI_ID:r.kpi_id,KPI_Code:r.kpi_code,Scope:r.scope,Scope_Omschrijving:r.scope_description,
      Bron:r.provider,Model:r.model,Gegenereerd_Op:r.created_at,Review_Status:r.review_status,Bron_Hash:r.source_hash,Generatie_Methode:r.generation_method};
    if(flavor==='insights')return [{...common,Titel:r.insight.title,Inzicht:r.insight.text,Onderbouwing:r.insight.evidence_ids.join(';'),Waarde:r.facts.value,Target:r.facts.target,Waarde_VJ:r.facts.previous_year,Eenheid:r.facts.unit,Periode_Definitie:r.facts.period_definition}];
    if(flavor==='deep-dives')return [{...common,Focus_Wijk_ID:r.deep_dive.wijk_id,Focus_Wijk:r.deep_dive.wijk_naam,Observatie:r.deep_dive.observation,Hypothese:'Hypothese: '+stripMissing(r.deep_dive.hypothesis.replace(/^(?:(?:Hypothese|Hypothesis):\s*)+/i,''),r.deep_dive.missing_data),Ontbrekende_Data:r.deep_dive.missing_data,Onderbouwing:r.deep_dive.evidence_ids.join(';'),Wijk_Waarde:r.deep_dive.value,Wijk_Target:r.deep_dive.target,Wijk_Waarde_VJ:r.deep_dive.previous_year}];
    return r.recommendations.map((a,i)=>({...common,Advies_ID:r.context_id+'_'+(i+1),Volgorde:i+1,Titel:a.title,Suggestie:a.suggestion,Te_Toetsen:a.check,Onderbouwing:a.evidence_ids.join(';')}));
  });
}
export function createServer({data=loadData(),getOutput=readOutput}={}) {
  const cs=contexts(data);
  return http.createServer((req,res)=>{
    const send=(status,body,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(typeof body==='string'?body:JSON.stringify(body));};
    try {
      if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'Alleen lezen. AI-generatie wordt lokaal door de organisator uitgevoerd.'});
      const url=new URL(req.url,'http://localhost');
      const snapshot=getOutput();
      const records=snapshot.records.filter(r=>r.source_hash===data.source_hash);
      const stale=snapshot.records.length-records.length;
      const status={service:'Donderdam workshop',schema_version:'1.0',synthetic_data:true,source_hash:data.source_hash,bi_rows:data.fact_kpi.length,available_contexts:cs.length,ai_contexts:records.length,ai_ready:records.length===cs.length,stale_ai_contexts:stale,llm_calls_on_read:false};
      if(url.pathname==='/health')return send(200,{ok:true,ai_ready:status.ai_ready});
      if(url.pathname==='/api/status')return send(200,status);
      if(url.pathname==='/') {
        const page=readFileSync(new URL('./public/index.html',import.meta.url),'utf8').replaceAll('{{AI_COUNT}}',String(records.length));
        return send(200,page,'text/html; charset=utf-8');
      }
      if(url.pathname.startsWith('/data/')) {
        const name=url.pathname.slice(6);
        if(!sourceNames.some(n=>n+'.csv'===name))return send(404,{error:'Onbekend bronbestand'});
        return send(200,readFileSync(new URL('./data/'+name,import.meta.url),'utf8'),'text/csv; charset=utf-8');
      }
      if(!['/api/contexts','/api/insights','/api/deep-dives','/api/recommendations','/api/ai'].includes(url.pathname))return send(404,{error:'Onbekend endpoint'});
      for(const k of url.searchParams.keys())if(!['month','kpi'].includes(k))return send(400,{error:'Gebruik alleen month (2026-06 t/m 2026-08) en kpi (WON, WLH, CO2).'});
      const month=url.searchParams.get('month'),kpi=url.searchParams.get('kpi');
      if(month&&!['2026-06','2026-07','2026-08'].includes(month))return send(400,{error:'Geen AI-dekking voor deze maand. Beschikbaar: 2026-06, 2026-07, 2026-08.'});
      if(kpi&&!['WON','WLH','CO2'].includes(kpi))return send(400,{error:'Geen AI-dekking voor deze KPI. Beschikbaar: WON, WLH, CO2.'});
      const matches=r=>(!month||r.peilmaand.startsWith(month))&&(!kpi||r.kpi_code===kpi);
      if(url.pathname==='/api/contexts')return send(200,cs.filter(matches));
      if(!records.length)return send(503,{error:'Nog geen actuele echte LLM-output. Eerst een generatie uitvoeren; er is geen simulatie als vervanging.',stale_ai_contexts:stale});
      if(url.pathname==='/api/ai')return send(200,{schema_version:'1.0',records:records.filter(matches)});
      return send(200,flatRows(records.filter(matches),url.pathname.slice(5)));
    } catch(error) {
      console.error('Verzoek kon niet worden verwerkt:',error.name);
      send(500,{error:'Databron kon niet worden gelezen. Controleer de lokale bouwtest.'});
    }
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const port=Number(process.env.PORT??3000);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Ongeldige PORT');
  createServer().listen(port,'0.0.0.0',()=>console.log(`Donderdam luistert op poort ${port}. GET-verzoeken roepen geen LLM aan.`));
}
