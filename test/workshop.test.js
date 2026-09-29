import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData,contexts,metric,parseCSV} from '../lib/data.js';
import {validateOutput,generate,buildRecord} from '../lib/ai.js';
import {createServer,flatRows} from '../lib/api.js';

const data=loadData(),cs=contexts(data);
const fixture={insight:{title:'Testinzicht',text:'Alleen een testrespons, geen workshopoutput.',evidence_ids:['gemeente']},deep_dive:{wijk_id:6,observation:'Testobservatie.',hypothesis:'Hypothese: dit is testtekst.',missing_data:'Testgegevens nodig.',evidence_ids:['wijk:6']},recommendations:Array.from({length:3},()=>({title:'Testadvies',suggestion:'Testvoorstel.',check:'Testcontrole.',evidence_ids:['gemeente']}))};
test('broncontrole: bekende gemeentecijfers en gewogen ratio',()=>{
  const won=metric(data,data.dim_kpi.find(k=>k.KPI_Code==='WON'),'2026-09-01');assert.equal(won.value,103);assert.equal(won.target,120);
  const wlh=metric(data,data.dim_kpi.find(k=>k.KPI_Code==='WLH'),'2026-09-01');assert.ok(Math.abs(wlh.value-0.08291561278454818)<1e-12);
  assert.equal(metric(data,data.dim_kpi[0],'2027-01-01'),null);
});
test('CO2-detail sluit voor alle maanden en wijken aan',()=>{
  for(const r of data.fact_kpi.filter(r=>r.KPI_ID===4))assert.ok(Math.abs(data.fact_co2_sector.filter(s=>s.Datum===r.Datum&&s.Wijk_ID===r.Wijk_ID).reduce((a,s)=>a+s.Ton,0)-r.Teller)<1e-9);
});
test('negen onafhankelijke contexten met historie, geen toekomstige kennis',()=>{
  assert.equal(cs.length,9);assert.equal(new Set(cs.map(c=>c.context_id)).size,9);
  for(const c of cs){assert.equal(c.wards.length,8);assert.equal(c.municipality.history.length,13);assert.ok(c.wards.every(w=>w.history.every(h=>h.month<=c.peilmaand)));}
  assert.notEqual(cs[0].municipality.value,cs[3].municipality.value);
});
test('CSV ondersteunt komma, regeleinde en dubbele quotes in tekst',()=>{assert.deepEqual(parseCSV('a,b\n1,"een, twee\n""drie"""\n'),[{a:'1',b:'een, twee\n"drie"'}]);});
test('LLM-validatie weigert verzonnen wijk, cijfers en ontbrekende acties',()=>{
  assert.doesNotThrow(()=>validateOutput(fixture,cs[0]));
  const bad=structuredClone(fixture);bad.deep_dive.wijk_id=999;assert.throws(()=>validateOutput(bad,cs[0]));
  bad.deep_dive.wijk_id=6;bad.insight.text='Stijgt met 10%';assert.throws(()=>validateOutput(bad,cs[0]));
  bad.insight.text='Test';bad.recommendations.pop();assert.throws(()=>validateOutput(bad,cs[0]));
});
test('gratis limietfout stopt, zonder retry of vervangende output',async()=>{
  let calls=0;await assert.rejects(generate(cs[0],{key:'test',model:'test',fetchImpl:async()=>{calls++;return {ok:false,status:429,json:async()=>({error:{message:'Quota bereikt'}})};}}),/HTTP 429/);assert.equal(calls,1);
});
test('API: contextfilter, nog geen AI, geen publieke generatie of sleutelbestanden',async(t)=>{
  const server=createServer({data,getOutput:()=>({records:[]})});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base+'/api/insights')).status,503);
  assert.equal((await fetch(base+'/api/contexts?month=2026-08&kpi=WON').then(r=>r.json())).length,1);
  assert.equal((await fetch(base+'/api/contexts?month=2027-01')).status,400);
  assert.equal((await fetch(base+'/.env')).status,404);
  assert.equal((await fetch(base+'/api/generate',{method:'POST'})).status,405);
  assert.equal((await fetch(base+'/data/fact_kpi.csv')).status,200);
  assert.match(await fetch(base+'/').then(r=>r.text()),/0 van 9/);
});
test('AI-eindpunten behouden context, rekenlaag en drie adviezen',async(t)=>{
  const record=buildRecord(cs[0],fixture,{provider:'TEST ALLEEN',model:'fixture',created_at:'2026-09-29T00:00:00Z',generation_method:'test'});
  const server=createServer({data,getOutput:()=>({records:[record]})});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}`;
  const rows=await fetch(base+'/api/recommendations?month=2026-06&kpi=WON').then(r=>r.json());assert.equal(rows.length,3);assert.equal(rows[0].Peilmaand,'2026-06-01');
  assert.equal(flatRows([record],'insights')[0].Waarde,cs[0].municipality.value);
  assert.equal((await fetch(base+'/api/insights?month=2026-08').then(r=>r.json())).length,0);
});
test('verdieping: dubbel hypothese-label en herhaalde ontbrekende data verdwijnen alleen uit de platte tabel',()=>{
  const r=structuredClone(fixture);r.deep_dive.hypothesis='Hypothese: Hypothesis: Een groot project loopt vertraging op. Ontbrekende gegevens: Testgegevens nodig.';
  const record=buildRecord(cs[0],r,{provider:'TEST ALLEEN',model:'fixture',created_at:'2026-09-29T00:00:00Z',generation_method:'test'});
  assert.equal(flatRows([record],'deep-dives')[0].Hypothese,'Hypothese: Een groot project loopt vertraging op.');
  assert.match(record.deep_dive.hypothesis,/Ontbrekende gegevens/);
  r.deep_dive.hypothesis='Hypothese: Ontbrekende gegevens: iets anders dan het aparte veld.';
  assert.match(flatRows([buildRecord(cs[0],r,{provider:'T',model:'f',created_at:'x',generation_method:'test'})],'deep-dives')[0].Hypothese,/iets anders/);
});
