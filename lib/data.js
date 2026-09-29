// Domeindata laden en per peilmaand de context bouwen die het LLM te zien krijgt.
// De rekenregels volgen de measures in Power BI: stromen jaar t/m maand, standen in de maand, doelen naar rato.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseCSV} from './csv.js';
export {parseCSV};

export const sourceNames=['dim_datum','dim_wijk','dim_kpi','dim_project','dim_leeftijd','dim_branche','dim_sector',
  'fact_bevolking','fact_oplevering','fact_werkloosheid','fact_vacatures','fact_co2','fact_doel'];
export const aiMonths=['2026-06-01','2026-07-01','2026-08-01'];
export const demoMonth='2026-09-01';
const text=new Set(['Datum','Maand','Kwartaal','KPI_Code','KPI_Naam','Eenheid','Domein','Periode','Wijk_Naam','Project_Code','Projectnaam','Aannemer','Segment',
  'Start_Bouw','Geplande_Oplevering_Tot','Leeftijdsgroep','Branche','Sector_Naam']);

export function loadData() {
  const data={}; const hash=createHash('sha256');
  for(const name of sourceNames) {
    const raw=readFileSync(new URL(`../data/${name}.csv`,import.meta.url),'utf8');
    hash.update(name+'\n'+raw);
    data[name]=parseCSV(raw).map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,text.has(k)?v:Number(v)])));
  }
  data.source_hash=hash.digest('hex'); return data;
}

const sum=(rows,c)=>rows.reduce((s,r)=>s+r[c],0);
const r1=v=>v==null?null:Math.round(v*10)/10;
const pct=v=>v==null?null:Math.round(v*1000)/10;            // ratio → procent met 1 decimaal
const shift=(m,n)=>{const d=new Date(m+'T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,10);};
const ytd=(rows,m,col)=>sum(rows.filter(r=>r.Datum>=m.slice(0,4)+'-01-01'&&r.Datum<=m),col);
const at=(rows,m)=>rows.filter(r=>r.Datum===m);

// Waarde van een KPI in maand m voor de gemeente (wijk=null) of één wijk. Zelfde definitie als [KPI Waarde].
export function kpiValue(data,code,m,wijk=null) {
  const w=r=>wijk===null||r.Wijk_ID===wijk;
  if(code==='WON'){const rows=data.fact_oplevering.filter(w);return rows.some(r=>r.Datum===m)?ytd(rows,m,'Opgeleverd'):null;}
  if(code==='CO2'){const rows=data.fact_co2.filter(w);return rows.some(r=>r.Datum===m)?r1(ytd(rows,m,'Ton')):null;}
  if(code==='INW'){const rows=at(data.fact_bevolking.filter(w),m);return rows.length?sum(rows,'Inwoners'):null;}
  if(code==='WLH'){const rows=at(data.fact_werkloosheid.filter(w),m);return rows.length?pct(sum(rows,'Werkzoekenden')/sum(rows,'Beroepsbevolking')):null;}
}
// Maandwaarde (niet cumulatief) voor tijdreeksen: stromen per maand, standen zoals ze zijn.
function monthValue(data,code,m,wijk=null){
  const w=r=>wijk===null||r.Wijk_ID===wijk;
  if(code==='WON')return sum(at(data.fact_oplevering.filter(w),m),'Opgeleverd');
  if(code==='CO2')return r1(sum(at(data.fact_co2.filter(w),m),'Ton'));
  return kpiValue(data,code,m,wijk);
}
export function kpiTarget(data,code,m,wijk=null) {
  const k=data.dim_kpi.find(k=>k.KPI_Code===code);
  const rows=data.fact_doel.filter(r=>r.KPI_ID===k.KPI_ID&&r.Jaar===+m.slice(0,4)&&(wijk===null||r.Wijk_ID===wijk));
  if(!rows.length)return null;
  if(code==='WLH')return pct(sum(rows,'Doel')/rows.length);
  const annual=sum(rows,'Doel');
  return ['WON','CO2'].includes(code)?r1(annual*+m.slice(5,7)/12):annual;
}
// Hoeveel maanden op rij (t/m m) de KPI ongunstig afwijkt van het doel. Berekend, niet door het LLM bepaald.
export function monthsUnfavourable(data,code,m,wijk=null) {
  const better=data.dim_kpi.find(k=>k.KPI_Code===code).Hoger_Is_Beter===1;
  let n=0;
  for(let d=m;d>='2024-01-01';d=shift(d,-1)){
    const v=kpiValue(data,code,d,wijk),t=kpiTarget(data,code,d,wijk);
    if(v==null||t==null||(better?v>=t:v<=t))break; n++;
  }
  return n;
}
function kpiBlock(data,k,m,wijk=null) {
  const v=kpiValue(data,k.KPI_Code,m,wijk),t=kpiTarget(data,k.KPI_Code,m,wijk),vj=kpiValue(data,k.KPI_Code,shift(m,-12),wijk);
  const pp=k.Eenheid==='%';
  return {waarde:v,doel:t,vorig_jaar:vj,
    verschil_met_doel:t==null?null:r1(v-t),
    verschil_met_vorig_jaar:vj==null?null:pp?r1(v-vj):r1((v/vj-1)*100),
    verschil_met_vorig_jaar_eenheid:pp?'procentpunt':'procent',
    maanden_op_rij_ongunstig_t_o_v_doel:monthsUnfavourable(data,k.KPI_Code,m,wijk)};
}

export function context(data,m) {
  const months13=Array.from({length:13},(_,i)=>shift(m,i-12));
  const wijkNaam=id=>data.dim_wijk.find(w=>w.Wijk_ID===id).Wijk_Naam;
  const kpis=data.dim_kpi.sort((a,b)=>a.Volgorde-b.Volgorde).map(k=>({
    kpi_code:k.KPI_Code,kpi:k.KPI_Naam,eenheid:k.Eenheid,periode:k.Periode,hoger_is_beter:k.Hoger_Is_Beter===1,
    gemeente:{...kpiBlock(data,k,m),maandreeks:months13.map(d=>({maand:d.slice(0,7),waarde:monthValue(data,k.KPI_Code,d)}))},
    wijken:data.dim_wijk.map(w=>({wijk_id:w.Wijk_ID,wijk:w.Wijk_Naam,...kpiBlock(data,k,m,w.Wijk_ID),
      maandreeks_6:months13.slice(-6).map(d=>monthValue(data,k.KPI_Code,d,w.Wijk_ID))}))
  }));
  const last3=[shift(m,-2),shift(m,-1),m];
  const projecten=data.dim_project.map(p=>{
    const rows=data.fact_oplevering.filter(r=>r.Project_ID===p.Project_ID);
    if(!rows.some(r=>r.Datum.slice(0,4)===m.slice(0,4)&&r.Datum<=m))return null;
    const g=ytd(rows,m,'Gepland'),o=ytd(rows,m,'Opgeleverd');
    return {project_code:p.Project_Code,project:p.Projectnaam,wijk_id:rows[0].Wijk_ID,wijk:wijkNaam(rows[0].Wijk_ID),aannemer:p.Aannemer,segment:p.Segment,
      gepland_jaar_tm_maand:g,opgeleverd_jaar_tm_maand:o,achterstand:g-o,
      opgeleverd_laatste_3_maanden:sum(rows.filter(r=>last3.includes(r.Datum)),'Opgeleverd'),gepland_laatste_3_maanden:sum(rows.filter(r=>last3.includes(r.Datum)),'Gepland')};
  }).filter(Boolean);
  const wl=(d,w,l)=>{const rows=data.fact_werkloosheid.filter(r=>r.Datum===d&&r.Wijk_ID===w&&r.Leeftijd_ID===l);return pct(sum(rows,'Werkzoekenden')/sum(rows,'Beroepsbevolking'));};
  const werkloosheid=data.dim_wijk.flatMap(w=>data.dim_leeftijd.map(l=>({wijk_id:w.Wijk_ID,wijk:w.Wijk_Naam,leeftijdsgroep:l.Leeftijdsgroep,
    werkloosheid_pct:wl(m,w.Wijk_ID,l.Leeftijd_ID),vorig_jaar_pct:wl(shift(m,-12),w.Wijk_ID,l.Leeftijd_ID)})));
  const vac=(d,b)=>sum(data.fact_vacatures.filter(r=>r.Datum===d&&r.Branche_ID===b),'Vacatures');
  const vacatures=data.dim_branche.map(b=>{const nu=vac(m,b.Branche_ID),vj=vac(shift(m,-12),b.Branche_ID);
    return {branche:b.Branche,openstaand:nu,vorig_jaar:vj,verschil_met_vorig_jaar_procent:r1((nu/vj-1)*100),maandreeks_6:months13.slice(-6).map(d=>vac(d,b.Branche_ID))};});
  const co2=(d,w,s)=>r1(ytd(data.fact_co2.filter(r=>r.Wijk_ID===w&&r.Sector_ID===s),d,'Ton'));
  const co2_sector=data.dim_wijk.flatMap(w=>data.dim_sector.map(s=>({wijk_id:w.Wijk_ID,wijk:w.Wijk_Naam,sector:s.Sector_Naam,
    ton_jaar_tm_maand:co2(m,w.Wijk_ID,s.Sector_ID),vorig_jaar:co2(shift(m,-12),w.Wijk_ID,s.Sector_ID)})));
  const bewijs=['gemeente',...data.dim_wijk.map(w=>`wijk:${w.Wijk_ID}`),...projecten.map(p=>`project:${p.project_code}`),
    ...data.dim_leeftijd.map(l=>`leeftijd:${l.Leeftijdsgroep}`),...data.dim_branche.map(b=>`branche:${b.Branche}`),...data.dim_sector.map(s=>`sector:${s.Sector_Naam}`)];
  return {context_id:m.slice(0,7),peilmaand:m,gemeente:'Donderdam (fictieve gemeente, 8 wijken)',source_hash:data.source_hash,
    toelichting:{stromen:'Nieuwe woningen en CO2 tellen op van januari t/m de peilmaand. Doelen voor stromen zijn het jaardoel naar rato.',
      standen:'Inwoners en werkloosheid zijn de stand in de peilmaand. Werkloosheid in procent van de beroepsbevolking.',
      maandreeks:'Waarde per maand (niet cumulatief), laatste 13 maanden gemeente, laatste 6 maanden per wijk.'},
    kpis,woningbouwprojecten:projecten,werkloosheid_per_leeftijd:werkloosheid,vacatures_per_branche:vacatures,co2_per_sector:co2_sector,
    toegestane_bewijs_sleutels:bewijs,
    niet_in_de_data:['huizenprijzen','vergunningen en bezwaren','bouwmaterialen','bedrijfssluitingen','subsidies','weer'],
  };
}
export function contexts(data=loadData()){return aiMonths.map(m=>context(data,m));}
