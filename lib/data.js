import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const dataDir = fileURLToPath(new URL('../data/', import.meta.url));
export const sourceNames = ['dim_datum','dim_wijk','dim_kpi','dim_sector','fact_kpi','fact_target','fact_co2_sector'];
export function parseCSV(text) {
  const rows=[]; let row=[], cell='', quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') { if(quoted && text[i+1]==='"') {cell+='"';i++;} else quoted=!quoted; }
    else if(c===',' && !quoted) {row.push(cell);cell='';}
    else if(c==='\n' && !quoted) {row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted) throw new Error('Niet afgesloten CSV-tekst');
  if(cell || row.length) {row.push(cell.replace(/\r$/,''));rows.push(row);}
  const headers=rows.shift();
  return rows.filter(r=>r.some(v=>v!=='')).map(r=>{
    if(r.length!==headers.length) throw new Error('CSV-kolomaantal klopt niet');
    return Object.fromEntries(headers.map((h,i)=>[h.replace(/^\uFEFF/,''),r[i]]));
  });
}
const numeric=new Set(['Wijk_ID','KPI_ID','Sector_ID','Teller','Noemer','Jaar','Target','Is_Ratio','Hoger_Is_Beter','Volgorde','Ton','Maandnummer','JaarMaand','Is_Prognoseperiode']);
export function loadData() {
  const data={}; const hash=createHash('sha256');
  for(const name of sourceNames) {
    const text=readFileSync(new URL(`../data/${name}.csv`,import.meta.url),'utf8');
    hash.update(name+'\n'+text);
    data[name]=parseCSV(text).map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,numeric.has(k)?Number(v):v])));
  }
  data.source_hash=hash.digest('hex'); return data;
}
const sum=(rows,col)=>rows.reduce((s,r)=>s+r[col],0);
export function metric(data,kpi,month,ward=null) {
  const year=Number(month.slice(0,4));
  const relevant=data.fact_kpi.filter(r=>r.KPI_ID===kpi.KPI_ID && (ward===null || r.Wijk_ID===ward));
  const current=relevant.filter(r=>kpi.Aggregatie==='stand'?r.Datum===month:r.Datum>=`${year}-01-01` && r.Datum<=month);
  if(!current.length) return null;
  const denominator=sum(current,'Noemer');
  const value=kpi.Is_Ratio ? sum(current,'Teller')/denominator : sum(current,'Teller');
  const targets=data.fact_target.filter(r=>r.KPI_ID===kpi.KPI_ID && r.Jaar===year && (ward===null || r.Wijk_ID===ward));
  // Alle ratio-doelen in de bron zijn gelijk per wijk. Bij uiteenlopende doelen niet stilzwijgend middelen.
  if(kpi.Is_Ratio && new Set(targets.map(r=>r.Target)).size>1) throw new Error('Gewogen ratio-doel vereist bij ongelijke wijkdoelen');
  const annual=targets.length ? (kpi.Is_Ratio?targets[0].Target:sum(targets,'Target')) : null;
  const target=annual===null?null:kpi.Aggregatie==='cumulatief'&&!kpi.Is_Ratio?annual*Number(month.slice(5,7))/12:annual;
  return {value,target,annual_target:annual,numerator:sum(current,'Teller'),denominator,
    unfavorable_gap:target===null?null:(target-value)*(kpi.Hoger_Is_Beter?1:-1),
    period_definition:kpi.Aggregatie==='stand'?'stand in peilmaand':kpi.Is_Ratio?'gewogen gemiddeld maandverbruik over januari t/m peilmaand':'som januari t/m peilmaand'};
}
export function context(data,month,kpiId) {
  const kpi=data.dim_kpi.find(k=>k.KPI_ID===kpiId); if(!kpi) throw new Error('Onbekende KPI');
  const earlier=(Number(month.slice(0,4))-1)+month.slice(4);
  const compare=(ward)=>{const now=metric(data,kpi,month,ward),prev=metric(data,kpi,earlier,ward);return {...now,previous_year:prev?.value??null,change:prev?(kpi.Eenheid==='%'?(now.value-prev.value)*100:prev.value===0?null:(now.value/prev.value-1)*100):null,change_unit:kpi.Eenheid==='%'?'procentpunt':'procent'};};
  const available=[...new Set(data.fact_kpi.map(r=>r.Datum))].filter(d=>d<=month).sort().slice(-13);
  const wards=data.dim_wijk.map(w=>({evidence_id:`wijk:${w.Wijk_ID}`,wijk_id:w.Wijk_ID,wijk_naam:w.Wijk_Naam,...compare(w.Wijk_ID),
    history:available.map(m=>({month:m,...metric(data,kpi,m,w.Wijk_ID)}))}));
  return {context_id:`${month.slice(0,7)}_${kpi.KPI_Code}`,peilmaand:month,kpi_id:kpiId,kpi_code:kpi.KPI_Code,kpi_naam:kpi.KPI_Naam,
    eenheid:kpi.Eenheid,scope:'gemeente',scope_description:'Gemeente Donderdam, alle acht wijken',
    synthetic_data:true,source_hash:data.source_hash,
    municipality:{evidence_id:'gemeente',...compare(null),history:available.map(m=>({month:m,...metric(data,kpi,m)}))},
    wards,limitations:['Fictieve gegevens, geen echte gemeente.','Geen gegevens over oorzaken zoals vergunningen, vacatures, huizenprijzen of aannemerscapaciteit.','Doelen voor stromen zijn lineair over het jaar verdeeld.']};
}
export function contexts(data=loadData()) {
  return ['2026-06-01','2026-07-01','2026-08-01'].flatMap(m=>[2,3,4].map(k=>context(data,m,k)));
}
