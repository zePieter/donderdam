// Echte LLM-generatie: één Gemini-aanroep per peilmaand, met de volledige Donderdam-context.
// Levert drie soorten AI-output met sleutels, zodat ze aan het semantisch model kunnen hangen:
//   signalen      → KPI × maand            (bij de KPI-kaart)
//   wijkduidingen → wijk × KPI × maand     (bij de wijkvisual)
//   aanbevelingen → aanbeveling × wijken   (stuurt de selectie van wijken)
import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';

export const outputFile=new URL('../data/ai-output.json',import.meta.url);
export const runsDir=new URL('../data/runs/',import.meta.url);
export const SCHEMA_VERSION='2.0';
export const prompt=`Je bent senior BI-analist bij de (fictieve) gemeente Donderdam. Je kijkt mee met het managementdashboard.
Je krijgt voor één peilmaand alle cijfers: vier KPI's voor de gemeente en acht wijken met doel, vorig jaar en tijdreeks,
plus de achterliggende domeindata: woningbouwprojecten met aannemer, werkloosheid per leeftijdsgroep, vacatures per branche en CO2 per sector.

Lever drie soorten output die naast de bestaande grafieken komen te staan:
1. signalen: precies één per KPI (INW, WON, WLH, CO2). Kies Afwijkende trend, Aandacht of Op koers. Een kop van maximaal acht woorden
   en een duiding van één of twee zinnen die méér zegt dan de kaart al toont: een patroon over de tijd, een wijk die het totaal bepaalt of een verband tussen domeinen.
2. wijkduidingen: vier tot zes opvallende combinaties van wijk en KPI, verdeeld over minstens drie KPI's. Beschrijf wat je ziet (observatie) en geef een hypothese die je
   onderbouwt met de domeindata, bijvoorbeeld een project of aannemer, een leeftijdsgroep of een branche. Noem wat nog getoetst moet worden.
3. aanbevelingen: precies drie mogelijke vervolgstappen voor het management, elk met de wijken waar het om gaat.

Regels:
- Gebruik alleen de meegeleverde data. Cijfers in je tekst neem je letterlijk over uit de context, zoals ze daar staan (Nederlandse notatie met komma mag).
- Een verklaring is een hypothese, geen feit. Oorzaken die niet in de data staan (zie niet_in_de_data) noem je alleen als ontbrekende informatie.
- Verwijs in bewijs alleen naar sleutels uit toegestane_bewijs_sleutels.
- Wees concreet: noem wijken, projecten, aannemers, leeftijdsgroepen en branches bij naam.
- Zoek verbanden tussen domeinen, bijvoorbeeld tussen werkloosheid, leeftijdsgroepen en vacatures per branche, of tussen woningbouw, projecten en aannemers.
- Elke hypothese steunt op minstens één sleutel uit de domeindata (project, leeftijd, branche of sector), niet alleen op een wijk.
- Een aanbeveling is een voorstel om te onderzoeken of te bespreken, geen besluit.
- Korte, heldere Nederlandse zinnen. Geen Markdown, geen begroeting. Antwoord uitsluitend volgens het JSON-schema.`;

const str=()=>({type:'string'});
const kpi={type:'string',enum:['INW','WON','WLH','CO2']};
export function schemaFor(c){
  return {type:'object',additionalProperties:false,required:['signalen','wijkduidingen','aanbevelingen'],properties:{
    signalen:{type:'array',minItems:4,maxItems:4,items:{type:'object',additionalProperties:false,required:['kpi_code','signaal','richting','kop','duiding','zekerheid'],properties:{
      kpi_code:kpi,signaal:{type:'string',enum:['Afwijkende trend','Aandacht','Op koers']},richting:{type:'string',enum:['verslechtert','stabiel','verbetert']},
      kop:str(70),duiding:str(320),zekerheid:{type:'string',enum:['hoog','middel','laag']}}}},
    wijkduidingen:{type:'array',minItems:4,maxItems:6,items:{type:'object',additionalProperties:false,required:['kpi_code','wijk_id','observatie','hypothese','bewijs','te_toetsen','zekerheid'],properties:{
      kpi_code:kpi,wijk_id:{type:'integer',minimum:1,maximum:8},observatie:str(300),hypothese:str(320),
      bewijs:{type:'array',minItems:1,maxItems:4,items:{type:'string'}},te_toetsen:str(220),zekerheid:{type:'string',enum:['hoog','middel','laag']}}}},
    aanbevelingen:{type:'array',minItems:3,maxItems:3,items:{type:'object',additionalProperties:false,required:['kpi_code','titel','voorstel','waarom','te_toetsen','wijk_ids'],properties:{
      kpi_code:kpi,titel:str(80),voorstel:str(280),waarom:str(240),te_toetsen:str(200),wijk_ids:{type:'array',minItems:1,maxItems:4,items:{type:'integer',minimum:1,maximum:8}}}}}
  }};
}

// Alle getallen die in de context voorkomen, als controlelijst voor getallen in AI-tekst.
function contextNumbers(c){
  const set=[];const walk=v=>{if(typeof v==='number')set.push(v);else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);};
  walk({...c,toegestane_bewijs_sleutels:undefined});
  for(const s of c.toegestane_bewijs_sleutels)for(const n of s.match(/\d+/g)??[])set.push(+n);
  return set;
}
const parseNL=s=>/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)?+s.replaceAll('.','').replace(',','.'):+s.replace(',','.');
export function unknownNumbers(textValue,c,known=contextNumbers(c)){
  const found=(textValue.replace(/CO2|CO₂/gi,'').match(/\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?/g)??[]).map(s=>[s,parseNL(s)]);
  return found.filter(([,x])=>!(x<=12&&Number.isInteger(x))&&!(x>=2024&&x<=2027)&&
    !known.some(v=>Math.abs(Math.abs(v)-x)<=Math.max(0.051,Math.abs(v)*0.005)||Math.abs(Math.round(Math.abs(v))-x)<0.001)).map(([s])=>s);
}
export function validateOutput(o,c){
  const errors=[];const need=(ok,msg)=>{if(!ok)errors.push(msg);};
  const known=contextNumbers(c);
  const texts=[];
  need(o&&Array.isArray(o.signalen)&&o.signalen.length===4,'Precies vier signalen nodig');
  need(new Set((o.signalen??[]).map(s=>s.kpi_code)).size===4,'Elk KPI precies één signaal');
  for(const s of o.signalen??[])texts.push(['signaal '+s.kpi_code,s.kop],['signaal '+s.kpi_code,s.duiding]);
  need(Array.isArray(o.wijkduidingen)&&o.wijkduidingen.length>=4&&o.wijkduidingen.length<=6,'Vier tot zes wijkduidingen nodig');
  for(const w of o.wijkduidingen??[]){
    need(c.kpis[0].wijken.some(x=>x.wijk_id===w.wijk_id),`Onbekende wijk ${w.wijk_id}`);
    need((w.bewijs??[]).every(b=>c.toegestane_bewijs_sleutels.includes(b)),`Onbekende bewijssleutel bij wijk ${w.wijk_id}`);
    need((w.bewijs??[]).some(b=>/^(project|leeftijd|branche|sector):/.test(b)),`Hypothese bij wijk ${w.wijk_id} steunt niet op domeindata (project, leeftijd, branche of sector)`);
    texts.push([`wijkduiding ${w.wijk_id}`,w.observatie],[`wijkduiding ${w.wijk_id}`,w.hypothese],[`wijkduiding ${w.wijk_id}`,w.te_toetsen]);
  }
  need(Array.isArray(o.aanbevelingen)&&o.aanbevelingen.length===3,'Precies drie aanbevelingen nodig');
  for(const a of o.aanbevelingen??[]){need((a.wijk_ids??[]).length>0,'Aanbeveling zonder wijken');texts.push(['aanbeveling',a.titel],['aanbeveling',a.voorstel],['aanbeveling',a.waarom],['aanbeveling',a.te_toetsen]);}
  for(const [label,t] of texts){
    if(typeof t!=='string'||!t.trim()){errors.push(`Lege tekst bij ${label}`);continue;}
    const bad=unknownNumbers(t,c,known);
    if(bad.length)errors.push(`Getal niet in de data bij ${label}: ${bad.join(', ')} ("${t.slice(0,90)}")`);
  }
  if(errors.length){const e=new Error('Validatie: '+errors.join(' | '));e.errors=errors;throw e;}
  return o;
}

export function readOutput(file=outputFile){
  try{const r=JSON.parse(readFileSync(file,'utf8'));if(r.schema_version!==SCHEMA_VERSION)return {schema_version:SCHEMA_VERSION,records:[]};return r;}
  catch(e){if(e.code==='ENOENT')return {schema_version:SCHEMA_VERSION,records:[]};throw e;}
}
export function storeRecord(record,file=outputFile){
  const current=readOutput(file);
  current.records=current.records.filter(r=>r.context_id!==record.context_id).concat(record).sort((a,b)=>a.context_id.localeCompare(b.context_id));
  const tmp=new URL(file.href+'.tmp');writeFileSync(tmp,JSON.stringify(current,null,2));renameSync(tmp,file);
}
export const contentHash=t=>createHash('sha256').update(t).digest('hex');

// Eén echte aanroep. Bij een validatiefout precies één herkansing mét de foutmelding; daarna stoppen. Geen simulatie.
export async function generate(c,{key,model,fetchImpl=fetch,log=()=>{}}){
  const schema=schemaFor(c);
  const contents=[{role:'user',parts:[{text:JSON.stringify(c)}]}];
  for(let attempt=1;attempt<=2;attempt++){
    const body={systemInstruction:{parts:[{text:prompt}]},contents,generationConfig:{responseMimeType:'application/json',responseJsonSchema:schema,maxOutputTokens:8192,temperature:0.4}};
    const started=Date.now();
    const response=await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});
    if(!response.ok){
      const detail=await response.json().catch(()=>({}));
      throw new Error(`Gemini HTTP ${response.status}: ${String(detail.error?.message??'geen omschrijving').split(key).join('[sleutel]').slice(0,500)}. Geen betaalde uitwijk of simulatie.`);
    }
    const raw=await response.json();
    const candidate=raw.candidates?.[0];
    if(candidate?.finishReason!=='STOP')throw new Error('Gemini-respons niet volledig afgerond: '+candidate?.finishReason);
    const textOut=candidate.content.parts.filter(p=>!p.thought&&p.text).map(p=>p.text).join('');
    const created_at=new Date().toISOString();
    const run_id=`${c.context_id}-${created_at.replace(/\D/g,'').slice(0,14)}`;
    const audit={run_id,attempt,created_at,latency_ms:Date.now()-started,model:raw.modelVersion??model,request_id:raw.responseId??null,usage:raw.usageMetadata??null,
      prompt,context:c,response_text:textOut};
    mkdirSync(runsDir,{recursive:true});writeFileSync(new URL(`${run_id}.json`,runsDir),JSON.stringify(audit,null,2));
    let parsed;
    try{parsed=validateOutput(JSON.parse(textOut),c);}
    catch(e){
      log(`poging ${attempt} afgekeurd: ${e.message}`);
      if(attempt===2)throw e;
      contents.push({role:'model',parts:[{text:textOut}]},{role:'user',parts:[{text:'Je antwoord is afgekeurd door de controle: '+e.message+'. Herstel alleen deze punten en lever het volledige JSON opnieuw.'}]});
      continue;
    }
    return {context_id:c.context_id,peilmaand:c.peilmaand,source_hash:c.source_hash,run_id,attempt,provider:'Google Gemini API',model:audit.model,requested_model:model,
      created_at,request_id:audit.request_id,latency_ms:audit.latency_ms,usage:audit.usage,prompt_hash:contentHash(prompt),response_hash:contentHash(textOut),
      review_status:'concept',generation_method:'api',output:parsed};
  }
}
