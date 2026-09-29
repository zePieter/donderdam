import { readFileSync,writeFileSync,renameSync,mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const outputFile=new URL('../data/ai-output.json',import.meta.url);
export const prompt=`Je bent een Nederlandstalige BI-analist voor de fictieve gemeente Donderdam.
Onderzoek de meegeleverde berekende cijfers: gemeentetotaal, acht wijken en hun tijdreeksen.
Lever drie complementaire toepassingen op: een inzicht over het gemeentetotaal of een terugkerend patroon;
een verdieping die een aantoonbaar opvallende wijk aanwijst; drie verschillende mogelijke vervolgstappen.
Grond iedere observatie in de data. Verzin geen oorzaken, bronnen, gebeurtenissen of bewezen effecten.
Een verklaring is uitsluitend een hypothese, nooit een feit. Begin de hypothese met 'Hypothese:'.
Vermeld welke ontbrekende gegevens nodig zijn om de hypothese te toetsen.
Schrijf geen getallen of percentages in tekstvelden: die worden naast jouw tekst uit de rekenlaag getoond.
Gebruik 'gemeente' en/of 'wijk:1' t/m 'wijk:8' als evidence_ids en kies een bestaande wijk_id.
Een aanbeveling is een voorstel om te onderzoeken, geen automatisch uit te voeren actie.
Gebruik korte heldere Nederlandse zinnen. Geen begroeting of Markdown. Antwoord volgens het JSON-schema.`;
const str={type:'string'};
const evidence={type:'array',items:{type:'string',enum:['gemeente',...Array.from({length:8},(_,i)=>`wijk:${i+1}`)]},minItems:1,maxItems:3};
export const schema={type:'object',properties:{
  insight:{type:'object',properties:{title:str,text:str,evidence_ids:evidence},required:['title','text','evidence_ids'],additionalProperties:false},
  deep_dive:{type:'object',properties:{wijk_id:{type:'integer',minimum:1,maximum:8},observation:str,hypothesis:str,missing_data:str,evidence_ids:evidence},required:['wijk_id','observation','hypothesis','missing_data','evidence_ids'],additionalProperties:false},
  recommendations:{type:'array',minItems:3,maxItems:3,items:{type:'object',properties:{title:str,suggestion:str,check:str,evidence_ids:evidence},required:['title','suggestion','check','evidence_ids'],additionalProperties:false}}
},required:['insight','deep_dive','recommendations'],additionalProperties:false};

export function validateOutput(o,c) {
  const text=(v,label,max=650)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/\d/.test(v.replace(/CO2/gi,'CO₂'))) throw new Error(`Ongeldige tekst: ${label}`);};
  const ev=(v)=>{if(!Array.isArray(v)||!v.length||v.length>3||v.some(e=>e!=='gemeente'&&!c.wards.some(w=>w.evidence_id===e))) throw new Error('Onbekende onderbouwing');};
  if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).some(k=>!['insight','deep_dive','recommendations'].includes(k))) throw new Error('Ongeldig responsobject');
  text(o.insight?.title,'titel',100);text(o.insight?.text,'inzicht');ev(o.insight?.evidence_ids);
  if(!c.wards.some(w=>w.wijk_id===o.deep_dive?.wijk_id)) throw new Error('Onbekende verdiepingswijk');
  for(const k of ['observation','hypothesis','missing_data'])text(o.deep_dive[k],k);
  if(!o.deep_dive.hypothesis.startsWith('Hypothese:'))throw new Error('Hypothese moet herkenbaar zijn');
  ev(o.deep_dive.evidence_ids);
  if(!o.deep_dive.evidence_ids.includes(`wijk:${o.deep_dive.wijk_id}`))throw new Error('Verdiepingswijk ontbreekt in onderbouwing');
  if(!Array.isArray(o.recommendations)||o.recommendations.length!==3)throw new Error('Precies drie aanbevelingen nodig');
  for(const r of o.recommendations){text(r.title,'advies titel',100);text(r.suggestion,'suggestie');text(r.check,'toets');ev(r.evidence_ids);}
  return o;
}
export function readOutput(file=outputFile) {
  try {
    const result=JSON.parse(readFileSync(file,'utf8'));
    if(result.schema_version!=='1.0'||!Array.isArray(result.records))throw new Error('Ongeldig AI-databestand');
    return result;
  } catch(e) {if(e.code==='ENOENT')return {schema_version:'1.0',records:[]};throw e;}
}
export function storeRecord(record,file=outputFile) {
  const current=readOutput(file);
  current.records=current.records.filter(r=>r.context_id!==record.context_id).concat(record).sort((a,b)=>a.context_id.localeCompare(b.context_id));
  const tmp=new URL(file.href+'.tmp');writeFileSync(tmp,JSON.stringify(current,null,2));renameSync(tmp,file);
}
export function buildRecord(c,output,provenance) {
  validateOutput(output,c);
  const w=c.wards.find(w=>w.wijk_id===output.deep_dive.wijk_id);
  return {context_id:c.context_id,peilmaand:c.peilmaand,kpi_id:c.kpi_id,kpi_code:c.kpi_code,scope:c.scope,scope_description:c.scope_description,
    source_hash:c.source_hash,review_status:'concept',...provenance,
    facts:{value:c.municipality.value,target:c.municipality.target,previous_year:c.municipality.previous_year,unit:c.eenheid,period_definition:c.municipality.period_definition},
    insight:output.insight,deep_dive:{...output.deep_dive,wijk_naam:w.wijk_naam,value:w.value,target:w.target,previous_year:w.previous_year},recommendations:output.recommendations};
}
export function contentHash(text){return createHash('sha256').update(text).digest('hex');}
export async function generate(c,{key,model,fetchImpl=fetch}) {
  const body={systemInstruction:{parts:[{text:prompt}]},contents:[{role:'user',parts:[{text:JSON.stringify(c)}]}],
    generationConfig:{responseMimeType:'application/json',responseJsonSchema:schema,maxOutputTokens:8192}};
  const response=await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
  if(!response.ok){
    const detail=await response.json().catch(()=>({}));
    const message=String(detail.error?.message??'Geen foutomschrijving ontvangen').split(key).join('[sleutel verwijderd]').slice(0,600);
    throw new Error(`Gemini HTTP ${response.status}: ${message}. Geen automatische retry, betaalde uitwijk of simulatie.`);
  }
  const raw=await response.json();
  const created_at=new Date().toISOString();
  const audit={context:c,prompt,request:body,response:raw,created_at};
  writeAudit(c.context_id,audit);
  const candidate=raw.candidates?.[0];
  if(candidate?.finishReason!=='STOP')throw new Error('Gemini-respons niet volledig afgerond');
  const text=candidate.content?.parts?.filter(p=>!p.thought&&p.text).map(p=>p.text).join('');
  const parsed=JSON.parse(text);
  if(typeof parsed.deep_dive?.hypothesis==='string')parsed.deep_dive.hypothesis='Hypothese: '+parsed.deep_dive.hypothesis.replace(/^(?:(?:Hypothese|Hypothesis):\s*)+/i,'');
  const output=validateOutput(parsed,c);
  const request_id=raw.responseId??null;
  const record=buildRecord(c,output,{provider:'Google Gemini API',model:raw.modelVersion??model,requested_model:model,created_at,request_id,prompt_hash:contentHash(prompt),response_hash:contentHash(text),generation_method:'api'});
  return {record,audit};
}
export function writeAudit(contextId,audit) {
  const path=new URL(`../runs/${contextId}_${Date.now()}.json`,import.meta.url);mkdirSync(new URL('../runs/',import.meta.url),{recursive:true});
  writeFileSync(path,JSON.stringify(audit,null,2));
}
