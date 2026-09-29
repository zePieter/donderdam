import http from 'node:http';
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {loadData,sourceNames,monthsUnfavourable} from './data.js';
import {readOutput,runsDir} from './ai.js';

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export const flavors=['signalen','wijkduidingen','aanbevelingen','aanbeveling-wijken'];

// Platte tabellen: één rij per sleutel, klaar voor Power BI. Herkomst op elke rij.
export function flatRows(records,flavor,data=loadData()){
  const kpiId=code=>data.dim_kpi.find(k=>k.KPI_Code===code).KPI_ID;
  const wijk=id=>data.dim_wijk.find(w=>w.Wijk_ID===id)?.Wijk_Naam;
  const bewijs=b=>{const [t,v]=b.split(/:(.*)/);if(t==='project'){const p=data.dim_project.find(p=>p.Project_Code===v);return p?`${p.Projectnaam} (${v}, ${p.Aannemer})`:b;}
    if(t==='wijk')return wijk(+v)??b;if(t==='gemeente')return 'gemeentetotaal';return `${{leeftijd:'leeftijdsgroep',branche:'branche',sector:'sector'}[t]??t} ${v}`;};
  return records.flatMap(r=>{
    const her={Run_ID:r.run_id,Model:r.model,Gegenereerd_Op:r.created_at,Review_Status:r.review_status};
    const o=r.output,ctx=r.context_id;
    if(flavor==='signalen')return o.signalen.map(s=>({Signaal_ID:`${ctx}|${s.kpi_code}`,Peilmaand:r.peilmaand,KPI_ID:kpiId(s.kpi_code),KPI_Code:s.kpi_code,
      Signaal:s.signaal,Richting:s.richting,Maanden_Op_Rij:monthsUnfavourable(data,s.kpi_code,r.peilmaand),Kop:s.kop,Duiding:s.duiding,Zekerheid:s.zekerheid,...her}));
    if(flavor==='wijkduidingen')return o.wijkduidingen.map((w,i)=>({Duiding_ID:`${ctx}|${w.kpi_code}|${w.wijk_id}|${i+1}`,Peilmaand:r.peilmaand,KPI_ID:kpiId(w.kpi_code),KPI_Code:w.kpi_code,
      Wijk_ID:w.wijk_id,Wijk_Naam:wijk(w.wijk_id),Observatie:w.observatie,Hypothese:/^hypothese/i.test(w.hypothese)?w.hypothese:'Hypothese: '+w.hypothese,
      Bewijs:w.bewijs.map(bewijs).join('; '),Te_Toetsen:w.te_toetsen,Zekerheid:w.zekerheid,...her}));
    if(flavor==='aanbevelingen')return o.aanbevelingen.map((a,i)=>({Aanbeveling_ID:`${ctx}-A${i+1}`,Peilmaand:r.peilmaand,KPI_ID:kpiId(a.kpi_code),KPI_Code:a.kpi_code,
      Volgorde:i+1,Titel:a.titel,Voorstel:a.voorstel,Waarom:a.waarom,Te_Toetsen:a.te_toetsen,...her}));
    if(flavor==='aanbeveling-wijken')return o.aanbevelingen.flatMap((a,i)=>[...new Set(a.wijk_ids)].map(w=>({Aanbeveling_ID:`${ctx}-A${i+1}`,Wijk_ID:w,Wijk_Naam:wijk(w)})));
    return [];
  });
}
export function currentRecords(data=loadData()){return readOutput().records.filter(r=>r.source_hash===data.source_hash);}
export function exportSnapshots(){
  const data=loadData(),records=currentRecords(data);
  for(const f of flavors)writeFileSync(new URL(`../data/ai-${f}.json`,import.meta.url),JSON.stringify(flatRows(records,f,data),null,2));
}
export function runList(){
  if(!existsSync(runsDir))return [];
  return readdirSync(runsDir).filter(f=>f.endsWith('.json')).sort().map(f=>{const a=JSON.parse(readFileSync(new URL(f,runsDir),'utf8'));
    return {run_id:a.run_id,peilmaand:a.context.peilmaand,poging:a.attempt,model:a.model,gegenereerd_op:a.created_at,latency_ms:a.latency_ms,
      tokens_in:a.usage?.promptTokenCount??null,tokens_uit:a.usage?.candidatesTokenCount??null,context_tekens:JSON.stringify(a.context).length};});
}
function runPage(a,accepted){
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Meekijken · run ${esc(a.run_id)}</title>
<style>body{margin:0;background:#e8e0d0;color:#3a3a3a;font:16px/1.5 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:32px 20px}h1{font-size:30px;margin:6px 0 16px}
.tag{color:#367f80;font-weight:650}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.panel{background:#f2eee5;border-radius:12px;padding:16px;margin:14px 0}
.k{font-size:13px;color:#6b6259}.v{font-size:20px;font-weight:650}pre{white-space:pre-wrap;word-break:break-word;font-size:12.5px;max-height:460px;overflow:auto;background:#fbf9f4;padding:12px;border-radius:8px}
a{color:#286f71}@media(max-width:700px){.grid{grid-template-columns:1fr 1fr}}</style></head><body><main>
<div class="tag">Meekijken over de schouder van het LLM</div><h1>Peilmaand ${esc(a.context.peilmaand.slice(0,7))} · run ${esc(a.run_id)}</h1>
<div class="grid"><div class="panel"><div class="k">Model</div><div class="v">${esc(a.model)}</div></div><div class="panel"><div class="k">Moment (UTC)</div><div class="v">${esc(a.created_at.slice(0,16).replace('T',' '))}</div></div>
<div class="panel"><div class="k">Denktijd</div><div class="v">${(a.latency_ms/1000).toFixed(1)} s</div></div><div class="panel"><div class="k">Tokens in / uit</div><div class="v">${a.usage?.promptTokenCount??'?'} / ${a.usage?.candidatesTokenCount??'?'}</div></div></div>
<p>${accepted?'✅ Deze respons is door de controle gekomen en staat in de AI-tabellen (status: concept).':'⏸ Niet in gebruik: afgekeurd door de controle (het model kreeg dan de foutmelding en een tweede kans) of vervangen door een nieuwere run.'}</p>
<div class="panel"><h2>1 · Instructie aan het model</h2><pre>${esc(a.prompt)}</pre></div>
<div class="panel"><h2>2 · Wat het model zag: de Donderdam-data (${JSON.stringify(a.context).length.toLocaleString('nl-NL')} tekens)</h2><pre>${esc(JSON.stringify(a.context,null,1))}</pre></div>
<div class="panel"><h2>3 · Wat het model antwoordde</h2><pre>${esc((()=>{try{return JSON.stringify(JSON.parse(a.response_text),null,1);}catch{return a.response_text;}})())}</pre></div>
<p><a href="/">← Terug</a> · <a href="/api/runs/${esc(a.run_id)}">Ruwe JSON</a></p></main></body></html>`;
}

export function createServer({data=loadData(),getRecords=()=>currentRecords(data)}={}){
  return http.createServer((req,res)=>{
    const send=(status,body,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(typeof body==='string'?body:JSON.stringify(body));};
    try{
      if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'Alleen lezen. AI-generatie gebeurt lokaal bij de organisator.'});
      const url=new URL(req.url,'http://localhost'),path=url.pathname.replace(/\/$/,'')||'/';
      const records=getRecords();
      const status={service:'Donderdam workshop',schema_version:'2.0',synthetic_data:true,source_hash:data.source_hash,ai_maanden:records.map(r=>r.context_id),
        ai_ready:records.length>=3,modellen:[...new Set(records.map(r=>r.model))],laatste_run:records.map(r=>r.created_at).sort().at(-1)??null,llm_calls_on_read:false};
      if(path==='/health')return send(200,{ok:true,ai_ready:status.ai_ready});
      if(path==='/api/status')return send(200,status);
      if(path==='/'){
        const runs=runList(),ok=new Set(records.map(r=>r.run_id));
        const rows=runs.slice().reverse().map(r=>`<tr><td><a href="/runs/${esc(r.run_id)}">${esc(r.peilmaand.slice(0,7))}</a></td><td>${esc(r.gegenereerd_op.slice(0,16).replace('T',' '))}</td><td>${esc(r.model)}</td><td>${(r.latency_ms/1000).toFixed(1)} s</td><td>${ok.has(r.run_id)?'✅ in gebruik':'⏸ niet in gebruik'}</td></tr>`).join('');
        return send(200,readFileSync(new URL('../public/index.html',import.meta.url),'utf8').replace('{{RUNS}}',rows||'<tr><td colspan="5">Nog geen runs</td></tr>').replaceAll('{{AI_MAANDEN}}',esc(status.ai_maanden.join(', ')||'nog geen')),'text/html; charset=utf-8');
      }
      if(path.startsWith('/runs/')||path.startsWith('/api/runs/')){
        const id=path.split('/').pop();if(!/^[\w-]+$/.test(id))return send(400,{error:'Ongeldige run'});
        const f=new URL(`${id}.json`,runsDir);if(!existsSync(f))return send(404,{error:'Onbekende run'});
        const a=JSON.parse(readFileSync(f,'utf8'));
        return path.startsWith('/api/')?send(200,a):send(200,runPage(a,records.some(r=>r.run_id===id)),'text/html; charset=utf-8');
      }
      if(path==='/api/runs')return send(200,runList());
      if(path.startsWith('/data/')){
        const name=path.slice(6);
        if(!sourceNames.some(n=>n+'.csv'===name))return send(404,{error:'Onbekend bronbestand'});
        return send(200,readFileSync(new URL('../data/'+name,import.meta.url),'utf8'),'text/csv; charset=utf-8');
      }
      const flavor=path.replace(/^\/api\//,'');
      if(!flavors.includes(flavor))return send(404,{error:'Onbekend endpoint'});
      for(const k of url.searchParams.keys())if(!['month','kpi','wijk'].includes(k))return send(400,{error:'Filters: month (bijv. 2026-08), kpi (INW, WON, WLH, CO2), wijk (1-8).'});
      const month=url.searchParams.get('month'),kpi=url.searchParams.get('kpi'),wijk=url.searchParams.get('wijk');
      let rows=flatRows(records.filter(r=>!month||r.context_id===month),flavor,data);
      if(kpi)rows=rows.filter(r=>r.KPI_Code===kpi||!('KPI_Code' in r));
      if(wijk)rows=rows.filter(r=>String(r.Wijk_ID)===wijk||!('Wijk_ID' in r));
      return send(200,rows);
    }catch(error){console.error('Verzoek mislukt:',error.message);send(500,{error:'Databron kon niet worden gelezen.'});}
  });
}
