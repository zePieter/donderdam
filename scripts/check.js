import assert from 'node:assert/strict';
import {loadData,contexts} from '../lib/data.js';
import {readOutput,validateOutput} from '../lib/ai.js';
const data=loadData(),cs=contexts(data),out=readOutput();
assert.equal(data.fact_kpi.length,1848);assert.equal(cs.length,9);
assert.equal(new Set(data.fact_kpi.map(r=>[r.Datum,r.Wijk_ID,r.KPI_ID].join('|'))).size,1848);
assert.equal(new Set(out.records.map(r=>r.context_id)).size,out.records.length);
assert.equal(out.records.length,9,'Voor dit workshop-pakket zijn negen echte AI-contexten nodig.');
for(const r of out.records){
  const c=cs.find(c=>c.context_id===r.context_id);assert.ok(c);assert.equal(r.source_hash,c.source_hash);
  validateOutput({insight:r.insight,deep_dive:r.deep_dive,recommendations:r.recommendations},c);
  assert.equal(r.generation_method,'api');assert.ok(r.request_id);assert.match(r.prompt_hash,/^[a-f0-9]{64}$/);assert.match(r.response_hash,/^[a-f0-9]{64}$/);
  assert.equal(r.facts.value,c.municipality.value);assert.equal(r.facts.target,c.municipality.target);assert.equal(r.facts.previous_year,c.municipality.previous_year);
  const w=c.wards.find(w=>w.wijk_id===r.deep_dive.wijk_id);assert.equal(r.deep_dive.value,w.value);assert.equal(r.deep_dive.target,w.target);
}
console.log(`BI-bron gecontroleerd; ${cs.length} contexten; ${out.records.length} echte AI-responses beschikbaar.`);
