// Leidt uit de fictieve basisreeksen (data/basis) een domeinmodel af: elk domein een eigen feit met eigen grain.
// Deterministisch: zelfde basis = zelfde uitkomst. Totalen per maand en wijk blijven gelijk aan de basis.
import {readFileSync,writeFileSync} from 'node:fs';
import {parseCSV} from '../lib/csv.js';

const read=n=>parseCSV(readFileSync(new URL(`../data/basis/${n}.csv`,import.meta.url),'utf8'));
const write=(n,cols,rows)=>writeFileSync(new URL(`../data/${n}.csv`,import.meta.url),
  [cols.join(','),...rows.map(r=>cols.map(c=>{const v=r[c];return typeof v==='string'&&/[",\n]/.test(v)?`"${v.replaceAll('"','""')}"`:v;}).join(','))].join('\n')+'\n');

const kpi=read('fact_kpi').map(r=>({...r,Wijk_ID:+r.Wijk_ID,KPI_ID:+r.KPI_ID,Teller:+r.Teller,Noemer:+r.Noemer}));
const target=read('fact_target').map(r=>({...r,Jaar:+r.Jaar,Wijk_ID:+r.Wijk_ID,KPI_ID:+r.KPI_ID,Target:+r.Target}));
const months=[...new Set(kpi.map(r=>r.Datum))].sort();
const wijken=[1,2,3,4,5,6,7,8];
const get=(d,w,k)=>kpi.find(r=>r.Datum===d&&r.Wijk_ID===w&&r.KPI_ID===k);
const idx=d=>months.indexOf(d);

// Verdeel een geheel totaal over gewichten met de grootste-restmethode.
function split(total,weights){
  const sum=weights.reduce((a,b)=>a+b,0)||1;
  const raw=weights.map(w=>total*w/sum),base=raw.map(Math.floor);
  let rest=total-base.reduce((a,b)=>a+b,0);
  raw.map((v,i)=>[v-Math.floor(v),i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{if(rest>0){base[i]++;rest--;}});
  return base;
}

// ---------- Dimensies ----------
write('dim_kpi',['KPI_ID','KPI_Code','KPI_Naam','Eenheid','Domein','Hoger_Is_Beter','Periode','Volgorde'],[
  {KPI_ID:1,KPI_Code:'INW',KPI_Naam:'Inwoners',Eenheid:'inwoners',Domein:'Bevolking',Hoger_Is_Beter:1,Periode:'stand in maand',Volgorde:4},
  {KPI_ID:2,KPI_Code:'WON',KPI_Naam:'Nieuwe woningen',Eenheid:'woningen',Domein:'Woningbouw',Hoger_Is_Beter:1,Periode:'jaar t/m maand',Volgorde:1},
  {KPI_ID:3,KPI_Code:'WLH',KPI_Naam:'Werkloosheid',Eenheid:'%',Domein:'Werk',Hoger_Is_Beter:0,Periode:'stand in maand',Volgorde:2},
  {KPI_ID:4,KPI_Code:'CO2',KPI_Naam:'CO2-uitstoot',Eenheid:'ton',Domein:'Duurzaamheid',Hoger_Is_Beter:0,Periode:'jaar t/m maand',Volgorde:3}]);
write('dim_leeftijd',['Leeftijd_ID','Leeftijdsgroep'],[{Leeftijd_ID:1,Leeftijdsgroep:'15-26 jaar'},{Leeftijd_ID:2,Leeftijdsgroep:'27-49 jaar'},{Leeftijd_ID:3,Leeftijdsgroep:'50-67 jaar'}]);
const branches=[['Bouw & Techniek',410],['Zorg & Welzijn',620],['Handel & Logistiek',370],['Zakelijke dienstverlening',300],['Horeca & Recreatie',220]];
write('dim_branche',['Branche_ID','Branche'],branches.map(([b],i)=>({Branche_ID:i+1,Branche:b})));

// Drie projecten per wijk met overlappende looptijden. Twee projecten van dezelfde aannemer lopen in 2026 vertraging op.
const names={1:['Groenhof Park','Hofkwartier','Groenhof Noord'],2:['Rietzoom Oever','De Rietlanden','Zoomhof'],3:['Havenhoofd','Noorderkade','Kraanbaan'],
  4:['Oude Stadswerf','Marktkwartier','Stadstuinen'],5:['Havenmeent Zuid','Havenkade','Meentpark'],6:['Zuidrand West','Zuidrandpark','Zuidrand Oost'],
  7:['Steenberg Hof','Kwartierhoven','Bergse Tuinen'],8:['Westerpoort','Westhof','Donderdam West Kade']};
const aannemers=['Bouwgroep Donderhout','De Waal & Zn','Aannemersbedrijf Kolk','BouwMeesters Noord'];
const segmenten=['sociale huur','middenhuur','koop'];
const windows=[['2024-01-01','2025-09-01'],['2025-04-01','2026-12-01'],['2026-01-01','2027-12-01']];
const delayed={'6-2':'2026-03-01','5-1':'2026-02-01'}; // Zuidrand Oost en Havenkade: aannemer Van Rijn Bouwcombinatie
const projects=[];
for(const w of wijken)for(let p=0;p<3;p++){
  const key=`${w}-${p}`;
  projects.push({Project_ID:projects.length+1,Project_Code:`P-${String(projects.length+1).padStart(2,'0')}`,Projectnaam:names[w][p],
    Aannemer:delayed[key]?'Van Rijn Bouwcombinatie':aannemers[(w+p)%aannemers.length],Segment:segmenten[(w*2+p)%3],
    Start_Bouw:windows[p][0],Geplande_Oplevering_Tot:windows[p][1],Wijk_ID:w,_delay:delayed[key]??null,_plan:0});
}
const active=(p,d)=>d>=p.Start_Bouw&&d<=p.Geplande_Oplevering_Tot;

// ---------- Woningoplevering: maand × project ----------
const oplevering=[];
for(const w of wijken){
  const ps=projects.filter(p=>p.Wijk_ID===w);
  const carry=new Map(ps.map(p=>[p.Project_ID,0]));
  // Planning loopt door tot het einde van de looptijd (voor Woningen_Gepland); feiten alleen t/m de laatste datamaand.
  const planMonths=[...months];
  for(let y=2026,m=+months.at(-1).slice(5,7)+1;y<2028;m++){if(m>12){m=1;y++;if(y===2028)break;}planMonths.push(`${y}-${String(m).padStart(2,'0')}-01`);}
  for(const d of planMonths){
    const act=ps.filter(p=>active(p,d)); if(!act.length)continue;
    const annual=target.find(t=>t.Jaar===Math.min(+d.slice(0,4),2026)&&t.Wijk_ID===w&&t.KPI_ID===2)?.Target??0;
    if(!months.includes(d)){act.forEach(p=>{const exact=annual/12/act.length+carry.get(p.Project_ID);const v=Math.round(exact);carry.set(p.Project_ID,exact-v);p._plan+=v;});continue;}
    // Planning: jaardoel per maand, gelijk over actieve projecten, afgerond met doorgeschoven rest.
    const plan=act.map(p=>{const exact=annual/12/act.length+carry.get(p.Project_ID);const v=Math.round(exact);carry.set(p.Project_ID,exact-v);return v;});
    const total=get(d,w,2).Teller;
    let actual;
    const di=act.findIndex(p=>p._delay&&d>=p._delay);
    if(di>=0&&act.length>1){
      const slow=Math.min(total,Math.round(plan[di]*0.3));
      const others=split(total-slow,act.map((p,i)=>i===di?0:Math.max(plan[i],1)));
      actual=others.map((v,i)=>i===di?slow:v);
    } else actual=split(total,plan.map(v=>Math.max(v,1)));
    act.forEach((p,i)=>{p._plan+=plan[i];oplevering.push({Datum:d,Project_ID:p.Project_ID,Wijk_ID:w,Gepland:plan[i],Opgeleverd:actual[i]});});
  }
}
write('dim_project',['Project_ID','Project_Code','Projectnaam','Aannemer','Segment','Woningen_Gepland','Start_Bouw','Geplande_Oplevering_Tot'],
  projects.map(p=>({...p,Woningen_Gepland:p._plan})));
write('fact_oplevering',['Datum','Project_ID','Wijk_ID','Gepland','Opgeleverd'],oplevering);

// ---------- Bevolking: maand × wijk (stand) ----------
write('fact_bevolking',['Datum','Wijk_ID','Inwoners','Huishoudens'],months.flatMap(d=>wijken.map(w=>({Datum:d,Wijk_ID:w,Inwoners:get(d,w,1).Teller,Huishoudens:get(d,w,6).Noemer}))));

// ---------- Werkloosheid: maand × wijk × leeftijdsgroep (stand) ----------
const ramp=(d,from,to)=>{const i=idx(d),s=idx('2025-12-01');return i<=s?from:Math.min(to,from+(to-from)*(i-s)/9);};
const werk=[];
for(const d of months)for(const w of wijken){
  const r=get(d,w,3);
  let shares=[0.30,0.42,0.28];
  if(w===2){const y=ramp(d,0.30,0.43);shares=[y,0.42-(y-0.30)/2,0.28-(y-0.30)/2];}   // Rietzoom: jongeren
  if(w===8){const m=ramp(d,0.42,0.55);shares=[0.30-(m-0.42)/2,m,0.28-(m-0.42)/2];}   // Donderdam West: 27-49, bouwvakkers
  const wz=split(r.Teller,shares),bb=split(r.Noemer,[0.2,0.5,0.3]);
  [0,1,2].forEach(i=>werk.push({Datum:d,Wijk_ID:w,Leeftijd_ID:i+1,Werkzoekenden:wz[i],Beroepsbevolking:bb[i]}));
}
write('fact_werkloosheid',['Datum','Wijk_ID','Leeftijd_ID','Werkzoekenden','Beroepsbevolking'],werk);

// ---------- Vacatures: maand × branche (gemeente, stand) ----------
write('fact_vacatures',['Datum','Branche_ID','Vacatures'],months.flatMap(d=>branches.map(([b,base],i)=>{
  const t=idx(d),m=+d.slice(5,7);
  let f=1+0.03*Math.sin((t+i*2)*1.3);
  if(i===0&&d>='2025-10-01')f*=Math.pow(0.982,t-idx('2025-09-01'));   // Bouw & Techniek krimpt
  if(i===1)f*=1+0.004*t;                                             // Zorg groeit
  if(i===4&&m>=5&&m<=8)f*=1.22;                                     // Horeca seizoen
  return {Datum:d,Branche_ID:i+1,Vacatures:Math.round(base*f)};
})));

// ---------- CO2: maand × wijk × sector, en doelen: jaar × wijk × KPI ----------
write('fact_co2',['Datum','Wijk_ID','Sector_ID','Ton'],read('fact_co2_sector').map(r=>({Datum:r.Datum,Wijk_ID:+r.Wijk_ID,Sector_ID:+r.Sector_ID,Ton:+r.Ton})));
write('fact_doel',['Datum','Jaar','Wijk_ID','KPI_ID','Doel'],target.filter(t=>t.KPI_ID<=4).map(t=>({Datum:`${t.Jaar}-01-01`,Jaar:t.Jaar,Wijk_ID:t.Wijk_ID,KPI_ID:t.KPI_ID,Doel:t.Target})));
console.log(`Domeinmodel geschreven: ${projects.length} projecten, ${oplevering.length} opleverrijen, ${werk.length} werkloosheidsrijen.`);
