import assert from 'node:assert/strict';
import {loadData,context,aiMonths,kpiValue,kpiTarget} from '../lib/data.js';
import {readOutput,validateOutput} from '../lib/ai.js';
import {flatRows,currentRecords} from '../lib/api.js';
const data=loadData();
assert.equal(data.fact_bevolking.length,264);assert.equal(data.fact_werkloosheid.length,792);assert.equal(data.fact_co2.length,792);
assert.equal(kpiValue(data,'WON','2026-08-01'),91);assert.equal(kpiTarget(data,'WON','2026-08-01'),106.7);
assert.equal(kpiValue(data,'WLH','2026-08-01'),8.2);assert.equal(kpiValue(data,'CO2','2026-08-01'),1849.5);
const records=currentRecords(data);
assert.deepEqual(records.map(r=>r.context_id).filter(id=>aiMonths.some(m=>m.startsWith(id))),aiMonths.map(m=>m.slice(0,7)),'Voor de workshop zijn echte AI-runs voor juni t/m augustus nodig.');
for(const r of records){
  assert.equal(r.generation_method,'api');assert.ok(r.request_id);assert.match(r.response_hash,/^[a-f0-9]{64}$/);
  validateOutput(r.output,context(data,r.peilmaand));
}
for(const f of ['signalen','wijkduidingen','aanbevelingen','aanbeveling-wijken'])assert.ok(flatRows(records,f,data).length>0);
console.log(`BI-bron gecontroleerd; ${records.length} echte AI-runs (${records.map(r=>r.context_id).join(', ')}) door de controle.`);
