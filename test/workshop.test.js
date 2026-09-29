import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadData,context,kpiValue,kpiTarget,monthsUnfavourable,parseCSV} from '../lib/data.js';
import {validateOutput,unknownNumbers,generate} from '../lib/ai.js';
import {createServer,flatRows} from '../lib/api.js';

const data=loadData(),c=context(data,'2026-08-01');
const fixture={signalen:['INW','WON','WLH','CO2'].map(k=>({kpi_code:k,signaal:'Aandacht',richting:'stabiel',kop:'Test',duiding:'Met 91 woningen tegenover 106,7.',zekerheid:'middel'})),
  wijkduidingen:[6,8,4,5].map(w=>({kpi_code:'WON',wijk_id:w,observatie:'Zuidrand haalt 13 van 20.',hypothese:'Hypothese: vertraging.',bewijs:[`wijk:${w}`,'project:P-18'],te_toetsen:'Planning.',zekerheid:'laag'})),
  aanbevelingen:[1,2,3].map(()=>({kpi_code:'WON',titel:'Gesprek',voorstel:'Overleg.',waarom:'Achterstand.',te_toetsen:'Planning.',wijk_ids:[6]}))};
const record={context_id:'2026-08',peilmaand:'2026-08-01',source_hash:data.source_hash,run_id:'test',model:'fixture',created_at:'2026-09-29T00:00:00Z',review_status:'concept',output:fixture};

test('domeinmodel: controlecijfers gelijk aan de oude KPI-bron',()=>{
  assert.equal(kpiValue(data,'WON','2026-08-01'),91);assert.equal(kpiTarget(data,'WON','2026-08-01'),106.7);
  assert.equal(kpiValue(data,'WON','2026-06-01'),70);assert.equal(kpiValue(data,'WLH','2026-08-01'),8.2);
  assert.equal(kpiValue(data,'WON','2026-08-01',6),13);assert.equal(kpiTarget(data,'WON','2026-08-01',6),20);
});
test('meta-inzicht wordt berekend, niet door het LLM verzonnen',()=>{assert.equal(monthsUnfavourable(data,'WON','2026-08-01'),5);assert.equal(monthsUnfavourable(data,'INW','2026-08-01'),0);});
test('context bevat domeindata en bewijssleutels',()=>{
  assert.equal(c.kpis.length,4);assert.ok(c.woningbouwprojecten.some(p=>p.project==='Zuidrand Oost'&&p.aannemer==='Van Rijn Bouwcombinatie'));
  assert.ok(c.toegestane_bewijs_sleutels.includes('branche:Bouw & Techniek'));
});
test('cijfercontrole: getallen uit de data mogen, verzonnen getallen niet',()=>{
  assert.deepEqual(unknownNumbers('Met 91 woningen tegen 106,7 en 1.849,5 ton; 8,2 procent; 5 maanden.',c),[]);
  assert.deepEqual(unknownNumbers('Een daling van 37,4 procent.',c),['37,4']);
});
test('validatie weigert onbekende wijk, bewijs zonder domeindata en verzonnen cijfers',()=>{
  assert.doesNotThrow(()=>validateOutput(fixture,c));
  const a=structuredClone(fixture);a.wijkduidingen[0].wijk_id=9;assert.throws(()=>validateOutput(a,c));
  const b=structuredClone(fixture);b.wijkduidingen[0].bewijs=['wijk:6'];assert.throws(()=>validateOutput(b,c),/domeindata/);
  const d=structuredClone(fixture);d.signalen[0].duiding='Een groei van 37,4 procent.';assert.throws(()=>validateOutput(d,c),/37,4/);
});
test('limietfout stopt direct, zonder retry of vervangende output',async()=>{
  let calls=0;await assert.rejects(generate(c,{key:'k',model:'m',fetchImpl:async()=>{calls++;return {ok:false,status:429,json:async()=>({error:{message:'Quota'}})};}}),/HTTP 429/);assert.equal(calls,1);
});
test('CSV ondersteunt komma, regeleinde en dubbele quotes',()=>{assert.deepEqual(parseCSV('a,b\n1,"een, twee\n""drie"""\n'),[{a:'1',b:'een, twee\n"drie"'}]);});
test('platte tabellen dragen sleutels en herkomst',()=>{
  const s=flatRows([record],'signalen',data);assert.equal(s.length,4);assert.equal(s.find(r=>r.KPI_Code==='WON').Maanden_Op_Rij,5);assert.equal(s[0].Run_ID,'test');
  const w=flatRows([record],'wijkduidingen',data);assert.match(w[0].Bewijs,/Zuidrand Oost \(P-18, Van Rijn Bouwcombinatie\)/);
  assert.equal(flatRows([record],'aanbeveling-wijken',data)[0].Wijk_Naam,'Zuidrand');
});
test('API: filters, alleen lezen, geen sleutelbestanden',async(t)=>{
  const server=createServer({data,getRecords:()=>[record]});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const base=`http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(base+'/api/signalen?month=2026-08&kpi=WON').then(r=>r.json())).length,1);
  assert.equal((await fetch(base+'/api/wijkduidingen?wijk=6').then(r=>r.json())).length,1);
  assert.equal((await fetch(base+'/api/generate',{method:'POST'})).status,405);
  assert.equal((await fetch(base+'/.env')).status,404);
  assert.equal((await fetch(base+'/data/fact_oplevering.csv')).status,200);
  assert.equal((await fetch(base+'/api/signalen?foo=1')).status,400);
});
