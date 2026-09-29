// Schrijft het semantisch model (TMDL) voor powerbi/start en powerbi/voorbeeld.
// Stermodel: domeinfeiten met eigen grain, gedeelde dimensies, 1:* in één richting, measures alleen in _Meetwaarden.
// start     = klassiek BI-model + AI-tabellen ingeladen, zonder AI-relaties of AI-measures (dat is de oefening).
// voorbeeld = idem, plus AI-relaties en AI-measures (uitwerking voor de demo).
import {writeFileSync,mkdirSync,rmSync,existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const HOST='https://donderdam.brusseedesign.nl/';
const dataDir=fileURLToPath(new URL('../data/',import.meta.url));
const tag=s=>{const h=createHash('sha1').update('donderdam|'+s).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const M={int:['int64','Int64.Type','0'],date:['dateTime','type date','dd-mm-yyyy'],text:['string','type text'],num:['double','type number','#,0.0']};

// [naam, bron, [[kolom, type, verborgen?]], extra]
const tables=[
  ['Dim_Datum','dim_datum.csv',[['Datum','date',0,'key'],['Jaar','int'],['Maandnummer','int',1],['Maand','text',0,'sort:JaarMaand'],['JaarMaand','int',1],['Kwartaal','text'],['Is_Prognoseperiode','int',1]],'date'],
  ['Dim_Wijk','dim_wijk.csv',[['Wijk_ID','int',1],['Wijk_Naam','text']]],
  ['Dim_KPI','dim_kpi.csv',[['KPI_ID','int',1],['KPI_Code','text'],['KPI_Naam','text',0,'sort:Volgorde'],['Eenheid','text'],['Domein','text'],['Hoger_Is_Beter','int',1],['Periode','text'],['Volgorde','int',1]]],
  ['Dim_Project','dim_project.csv',[['Project_ID','int',1],['Project_Code','text'],['Projectnaam','text'],['Aannemer','text'],['Segment','text'],['Woningen_Gepland','int'],['Start_Bouw','date'],['Geplande_Oplevering_Tot','date']]],
  ['Dim_Leeftijd','dim_leeftijd.csv',[['Leeftijd_ID','int',1],['Leeftijdsgroep','text',0,'sort:Leeftijd_ID']]],
  ['Dim_Branche','dim_branche.csv',[['Branche_ID','int',1],['Branche','text']]],
  ['Dim_Sector','dim_sector.csv',[['Sector_ID','int',1],['Sector_Naam','text']]],
  ['Fact_Bevolking','fact_bevolking.csv',[['Datum','date',1],['Wijk_ID','int',1],['Inwoners','num',1],['Huishoudens','num',1]]],
  ['Fact_Oplevering','fact_oplevering.csv',[['Datum','date',1],['Project_ID','int',1],['Wijk_ID','int',1],['Gepland','num',1],['Opgeleverd','num',1]]],
  ['Fact_Werkloosheid','fact_werkloosheid.csv',[['Datum','date',1],['Wijk_ID','int',1],['Leeftijd_ID','int',1],['Werkzoekenden','num',1],['Beroepsbevolking','num',1]]],
  ['Fact_Vacatures','fact_vacatures.csv',[['Datum','date',1],['Branche_ID','int',1],['Vacatures','num',1]]],
  ['Fact_CO2','fact_co2.csv',[['Datum','date',1],['Wijk_ID','int',1],['Sector_ID','int',1],['Ton','num',1]]],
  ['Fact_Doel','fact_doel.csv',[['Datum','date',1],['Jaar','int',1],['Wijk_ID','int',1],['KPI_ID','int',1],['Doel','num',1]]],
];
const aiTables=[
  ['AI_Signaal','signalen',[['Signaal_ID','text'],['Peilmaand','date'],['KPI_ID','int'],['KPI_Code','text'],['Signaal','text'],['Richting','text'],['Maanden_Op_Rij','int'],['Kop','text'],['Duiding','text'],['Zekerheid','text'],['Run_ID','text'],['Model','text'],['Gegenereerd_Op','text'],['Review_Status','text']]],
  ['AI_Wijkduiding','wijkduidingen',[['Duiding_ID','text'],['Peilmaand','date'],['KPI_ID','int'],['KPI_Code','text'],['Wijk_ID','int'],['Wijk_Naam','text'],['Observatie','text'],['Hypothese','text'],['Bewijs','text'],['Te_Toetsen','text'],['Zekerheid','text'],['Run_ID','text'],['Model','text'],['Gegenereerd_Op','text'],['Review_Status','text']]],
  ['AI_Aanbeveling','aanbevelingen',[['Aanbeveling_ID','text'],['Peilmaand','date'],['KPI_ID','int'],['KPI_Code','text'],['Volgorde','int'],['Titel','text'],['Voorstel','text'],['Waarom','text'],['Te_Toetsen','text'],['Run_ID','text'],['Model','text'],['Gegenereerd_Op','text'],['Review_Status','text']]],
  ['AI_Aanbeveling_Wijk','aanbeveling-wijken',[['Aanbeveling_ID','text'],['Wijk_ID','int'],['Wijk_Naam','text']]],
];
const rel=[
  ['Fact_Bevolking.Datum','Dim_Datum.Datum'],['Fact_Bevolking.Wijk_ID','Dim_Wijk.Wijk_ID'],
  ['Fact_Oplevering.Datum','Dim_Datum.Datum'],['Fact_Oplevering.Wijk_ID','Dim_Wijk.Wijk_ID'],['Fact_Oplevering.Project_ID','Dim_Project.Project_ID'],
  ['Fact_Werkloosheid.Datum','Dim_Datum.Datum'],['Fact_Werkloosheid.Wijk_ID','Dim_Wijk.Wijk_ID'],['Fact_Werkloosheid.Leeftijd_ID','Dim_Leeftijd.Leeftijd_ID'],
  ['Fact_Vacatures.Datum','Dim_Datum.Datum'],['Fact_Vacatures.Branche_ID','Dim_Branche.Branche_ID'],
  ['Fact_CO2.Datum','Dim_Datum.Datum'],['Fact_CO2.Wijk_ID','Dim_Wijk.Wijk_ID'],['Fact_CO2.Sector_ID','Dim_Sector.Sector_ID'],
  ['Fact_Doel.Datum','Dim_Datum.Datum'],['Fact_Doel.Wijk_ID','Dim_Wijk.Wijk_ID'],['Fact_Doel.KPI_ID','Dim_KPI.KPI_ID'],
];
const aiRel=[
  ['AI_Signaal.Peilmaand','Dim_Datum.Datum'],['AI_Signaal.KPI_ID','Dim_KPI.KPI_ID'],
  ['AI_Wijkduiding.Peilmaand','Dim_Datum.Datum'],['AI_Wijkduiding.KPI_ID','Dim_KPI.KPI_ID'],['AI_Wijkduiding.Wijk_ID','Dim_Wijk.Wijk_ID'],
  ['AI_Aanbeveling.Peilmaand','Dim_Datum.Datum'],['AI_Aanbeveling.KPI_ID','Dim_KPI.KPI_ID'],
  ['AI_Aanbeveling_Wijk.Aanbeveling_ID','AI_Aanbeveling.Aanbeveling_ID'],['AI_Aanbeveling_Wijk.Wijk_ID','Dim_Wijk.Wijk_ID'],
];

// [map, naam, expressie, format]
const measures=[
  ['1 Woningbouw','Woningen Opgeleverd','SUM ( Fact_Oplevering[Opgeleverd] )','#,0'],
  ['1 Woningbouw','Woningen Opgeleverd YTD','CALCULATE ( [Woningen Opgeleverd], DATESYTD ( Dim_Datum[Datum] ) )','#,0'],
  ['1 Woningbouw','Woningen Gepland YTD','CALCULATE ( SUM ( Fact_Oplevering[Gepland] ), DATESYTD ( Dim_Datum[Datum] ) )','#,0'],
  ['1 Woningbouw','Woningen Achterstand YTD','[Woningen Gepland YTD] - [Woningen Opgeleverd YTD]','#,0'],
  ['2 Bevolking','Inwoners','VAR _m = CALCULATE ( MAX ( Fact_Bevolking[Datum] ) )\nRETURN CALCULATE ( SUM ( Fact_Bevolking[Inwoners] ), Dim_Datum[Datum] = _m )','#,0'],
  ['2 Bevolking','Huishoudens','VAR _m = CALCULATE ( MAX ( Fact_Bevolking[Datum] ) )\nRETURN CALCULATE ( SUM ( Fact_Bevolking[Huishoudens] ), Dim_Datum[Datum] = _m )','#,0'],
  ['3 Werk','Werkloosheid','VAR _m = CALCULATE ( MAX ( Fact_Werkloosheid[Datum] ) )\nRETURN CALCULATE ( DIVIDE ( SUM ( Fact_Werkloosheid[Werkzoekenden] ), SUM ( Fact_Werkloosheid[Beroepsbevolking] ) ), Dim_Datum[Datum] = _m )','0.0%'],
  ['3 Werk','Werkzoekenden','VAR _m = CALCULATE ( MAX ( Fact_Werkloosheid[Datum] ) )\nRETURN CALCULATE ( SUM ( Fact_Werkloosheid[Werkzoekenden] ), Dim_Datum[Datum] = _m )','#,0'],
  ['3 Werk','Vacatures','VAR _m = CALCULATE ( MAX ( Fact_Vacatures[Datum] ) )\nRETURN CALCULATE ( SUM ( Fact_Vacatures[Vacatures] ), Dim_Datum[Datum] = _m )','#,0'],
  ['4 Duurzaamheid','CO2 Ton','SUM ( Fact_CO2[Ton] )','#,0'],
  ['4 Duurzaamheid','CO2 YTD','CALCULATE ( [CO2 Ton], DATESYTD ( Dim_Datum[Datum] ) )','#,0'],
  ['5 Doel','Peildatum','VAR _laatste = CALCULATE ( MAX ( Fact_Bevolking[Datum] ), REMOVEFILTERS () )\nRETURN MIN ( MAX ( Dim_Datum[Datum] ), EOMONTH ( _laatste, 0 ) )','dd-mm-yyyy'],
  ['5 Doel','Doel','VAR _code = SELECTEDVALUE ( Dim_KPI[KPI_Code] )\nVAR _d = [Peildatum]\nVAR _jaardoel = CALCULATE ( IF ( _code = "WLH", AVERAGE ( Fact_Doel[Doel] ), SUM ( Fact_Doel[Doel] ) ), REMOVEFILTERS ( Dim_Datum ), Fact_Doel[Jaar] = YEAR ( _d ) )\nRETURN IF ( ISBLANK ( _code ), BLANK (), IF ( _code IN { "WON", "CO2" }, _jaardoel * MONTH ( _d ) / 12, _jaardoel ) )','#,0.00'],
  ['5 Doel','Doel Woningen YTD','CALCULATE ( [Doel], REMOVEFILTERS ( Dim_KPI ), Dim_KPI[KPI_Code] = "WON" )','#,0'],
  ['5 Doel','Doel Werkloosheid','CALCULATE ( [Doel], REMOVEFILTERS ( Dim_KPI ), Dim_KPI[KPI_Code] = "WLH" )','0.0%'],
  ['5 Doel','Doel CO2 YTD','CALCULATE ( [Doel], REMOVEFILTERS ( Dim_KPI ), Dim_KPI[KPI_Code] = "CO2" )','#,0'],
  ['5 Doel','Doel Inwoners','CALCULATE ( [Doel], REMOVEFILTERS ( Dim_KPI ), Dim_KPI[KPI_Code] = "INW" )','#,0'],
  ['6 KPI-keuze','KPI Waarde','SWITCH ( SELECTEDVALUE ( Dim_KPI[KPI_Code] ), "WON", [Woningen Opgeleverd YTD], "WLH", [Werkloosheid], "CO2", [CO2 YTD], "INW", [Inwoners] )','#,0.00'],
  ['6 KPI-keuze','KPI Target','[Doel]','#,0.00'],
  ['6 KPI-keuze','KPI Waarde VJ','CALCULATE ( [KPI Waarde], SAMEPERIODLASTYEAR ( Dim_Datum[Datum] ) )','#,0.00'],
  ['6 KPI-keuze','KPI Trend','VAR _nu = [KPI Waarde]\nVAR _vj = [KPI Waarde VJ]\nRETURN IF ( ISBLANK ( _nu ) || ISBLANK ( _vj ), BLANK (), IF ( SELECTEDVALUE ( Dim_KPI[Eenheid] ) = "%", _nu - _vj, DIVIDE ( _nu - _vj, _vj ) ) )','0.0%'],
  ['6 KPI-keuze','KPI Op Koers','VAR _v = [KPI Waarde]\nVAR _t = [KPI Target]\nRETURN IF ( ISBLANK ( _v ) || ISBLANK ( _t ), BLANK (), IF ( IF ( SELECTEDVALUE ( Dim_KPI[Hoger_Is_Beter] ) = 1, _v >= _t, _v <= _t ), 1, 0 ) )','0'],
  ['7 Opmaak','KPI Waarde Tekst','VAR _code = SELECTEDVALUE ( Dim_KPI[KPI_Code] )\nVAR _v = [KPI Waarde]\nRETURN IF ( ISBLANK ( _v ), BLANK (), SWITCH ( _code, "INW", FORMAT ( _v / 1000, "0.0" ) & "K", "WLH", FORMAT ( _v * 100, "0.0" ) & "%", "CO2", FORMAT ( _v, "#,0" ) & "t", FORMAT ( _v, "#,0" ) ) )'],
  ['7 Opmaak','KPI Target Tekst','VAR _code = SELECTEDVALUE ( Dim_KPI[KPI_Code] )\nVAR _v = [KPI Target]\nRETURN IF ( ISBLANK ( _v ), BLANK (), SWITCH ( _code, "INW", FORMAT ( _v / 1000, "0.0" ) & "K", "WLH", FORMAT ( _v * 100, "0.0" ) & "%", "CO2", FORMAT ( _v, "#,0" ) & "t", FORMAT ( _v, "#,0" ) ) )'],
  ['7 Opmaak','KPI Trend Tekst','VAR _v = [KPI Trend]\nRETURN IF ( ISBLANK ( _v ), "Geen vergelijkbare historie", IF ( SELECTEDVALUE ( Dim_KPI[Eenheid] ) = "%", FORMAT ( _v * 100, "+0.0;-0.0;0.0" ) & " procentpunt", FORMAT ( _v, "+0.0%;-0.0%;0.0%" ) ) )'],
  ['7 Opmaak','KPI Kleur','IF ( [KPI Op Koers] = 0, "#E8603C", "#4A9FA0" )'],
  ['7 Opmaak','Contextlabel','VAR _p = SELECTEDVALUE ( Dim_Datum[Maand], "Kies een maand" )\nVAR _k = SELECTEDVALUE ( Dim_KPI[KPI_Naam], "Kies een KPI" )\nRETURN _k & " | " & _p & " | " & IF ( ISFILTERED ( Dim_Wijk ), "Wijkselectie", "Gemeente: alle acht wijken" )'],
];
// Alleen in het voorbeeld: de uitgewerkte AI-verrijking.
const aiMeasures=[
  ['9 AI\\1 Signaal','AI Signaal','SELECTEDVALUE ( AI_Signaal[Signaal] )'],
  ['9 AI\\1 Signaal','AI Signaal Tekst','IF ( COUNTROWS ( AI_Signaal ) = 1,\n    SELECTEDVALUE ( AI_Signaal[Kop] ) & UNICHAR ( 10 ) & SELECTEDVALUE ( AI_Signaal[Duiding] ) & UNICHAR ( 10 ) & "Zekerheid: " & SELECTEDVALUE ( AI_Signaal[Zekerheid] ),\n    "Geen AI-signaal voor deze selectie." )'],
  ['9 AI\\1 Signaal','AI Signaal Kleur','SWITCH ( [AI Signaal], "Afwijkende trend", "#E8603C", "Aandacht", "#EF9F27", "Op koers", "#3BAA5C", "#6B6259" )'],
  ['9 AI\\2 Wijkduiding','AI Wijkduiding Aanwezig','IF ( NOT ISEMPTY ( AI_Wijkduiding ), 1 )','0'],
  ['9 AI\\3 Aanbeveling','AI Aanbevolen Wijk','IF ( NOT ISEMPTY ( AI_Aanbeveling_Wijk ), 1 )','0'],
  ['9 AI\\3 Aanbeveling','AI Wijk Kleur','IF ( [AI Aanbevolen Wijk] = 1, "#E8603C", "#4A9FA0" )'],
  ['9 AI\\Herkomst','AI Herkomst','VAR _m = SELECTEDVALUE ( AI_Signaal[Model] )\nVAR _t = SELECTEDVALUE ( AI_Signaal[Gegenereerd_Op] )\nRETURN IF ( ISBLANK ( _m ), "Geen AI-output voor deze selectie", _m & " | " & FORMAT ( DATEVALUE ( LEFT ( _t, 10 ) ), "d mmm yyyy" ) & " " & MID ( _t, 12, 5 ) & " UTC | " & SELECTEDVALUE ( AI_Signaal[Review_Status] ) )'],
];

const indent=(s,n)=>s.split('\n').map(l=>'\t'.repeat(n)+l).join('\n');
function tableTmdl(name,cols,source,{date=false}={}) {
  let t=`table ${name}\n\tlineageTag: ${tag(name)}\n${date?'\tdataCategory: Time\n':''}\n`;
  for(const [c,type,hidden,extra] of cols){
    const [dt,,fmt]=M[type];
    t+=`\tcolumn ${c}\n\t\tdataType: ${dt}\n${hidden?'\t\tisHidden\n':''}${extra==='key'?'\t\tisKey\n':''}${fmt?`\t\tformatString: ${fmt}\n`:''}\t\tlineageTag: ${tag(name+'.'+c)}\n\t\tsummarizeBy: none\n\t\tsourceColumn: ${c}\n${extra?.startsWith?.('sort:')?`\t\tsortByColumn: ${extra.slice(5)}\n`:''}\n`;
  }
  t+=`\tpartition ${name} = m\n\t\tmode: import\n\t\tsource =\n${indent(source,4)}\n\n\tannotation PBI_ResultType = Table\n`;
  return t;
}
const typesM=cols=>'{'+cols.map(([c,type])=>`{"${c}", ${M[type][1]}}`).join(', ')+'}';
const csvSource=(file,cols)=>`let\n    Bron = Csv.Document(LeesBron("${file}"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),\n    Kop = Table.PromoteHeaders(Bron, [PromoteAllScalars = true]),\n    Typen = Table.TransformColumnTypes(Kop, ${typesM(cols)}, "en-US")\nin\n    Typen`;
const aiSource=(naam,cols)=>`let\n    Bron = LeesAI("${naam}"),\n    Tabel = Table.FromRecords(Bron, ${JSON.stringify(cols.map(c=>c[0])).replace(/^\[/,'{').replace(/\]$/,'}')}, MissingField.UseNull),\n    Typen = Table.TransformColumnTypes(Tabel, ${typesM(cols)}, "en-US")\nin\n    Typen`;
function measuresTmdl(list) {
  let t=`/// Alle measures. Mappen: 1-4 domein, 5 doelen, 6 KPI-keuze (voor de KPI-slicer), 7 opmaak${list.length>measures.length?', 9 AI':''}.\ntable _Meetwaarden\n\tlineageTag: ${tag('_Meetwaarden')}\n\n`;
  for(const [folder,name,expr,fmt] of list)
    t+=`\tmeasure '${name}' =\n${indent(expr,3)}\n${fmt?`\t\tformatString: ${fmt}\n`:''}\t\tdisplayFolder: ${folder}\n\t\tlineageTag: ${tag('m.'+name)}\n\n`;
  t+=`\tcolumn Sleutel\n\t\tdataType: int64\n\t\tisHidden\n\t\tlineageTag: ${tag('_Meetwaarden.Sleutel')}\n\t\tsummarizeBy: none\n\t\tsourceColumn: Sleutel\n\n\tpartition _Meetwaarden = m\n\t\tmode: import\n\t\tsource = #table(type table [Sleutel = Int64.Type], {})\n\n\tannotation PBI_ResultType = Table\n`;
  return t;
}
const relTmdl=list=>list.map(([f,t])=>`relationship ${tag('rel.'+f)}\n\tfromColumn: ${f}\n\ttoColumn: ${t}\n`).join('\n');

const withAI=aiTables.every(([,n])=>existsSync(new URL(`../data/ai-${n}.json`,import.meta.url)));
for(const variant of ['start','voorbeeld']) {
  const def=fileURLToPath(new URL(`../powerbi/${variant}/Donderdam.SemanticModel/definition/`,import.meta.url));
  rmSync(def+'tables',{recursive:true,force:true});rmSync(def+'cultures',{recursive:true,force:true});mkdirSync(def+'tables',{recursive:true});
  const all=[...tables.map(t=>t[0]),...(withAI?aiTables.map(t=>t[0]):[]),'_Meetwaarden'];
  for(const [name,file,cols,kind] of tables)writeFileSync(def+`tables/${name}.tmdl`,tableTmdl(name,cols,csvSource(file,cols),{date:kind==='date'}));
  if(withAI)for(const [name,naam,cols] of aiTables)writeFileSync(def+`tables/${name}.tmdl`,tableTmdl(name,cols,aiSource(naam,cols)));
  writeFileSync(def+'tables/_Meetwaarden.tmdl',measuresTmdl(variant==='voorbeeld'&&withAI?[...measures,...aiMeasures]:measures));
  writeFileSync(def+'relationships.tmdl',relTmdl(variant==='voorbeeld'&&withAI?[...rel,...aiRel]:rel));
  writeFileSync(def+'model.tmdl',`model Model\n\tculture: nl-NL\n\tdefaultPowerBIDataSourceVersion: powerBI_V3\n\tdiscourageImplicitMeasures\n\tsourceQueryCulture: nl-NL\n\tdataAccessOptions\n\t\tlegacyRedirects\n\t\treturnErrorValuesAsNull\n\nannotation __PBI_TimeIntelligenceEnabled = 0\n\nannotation PBI_ProTooling = ["DevMode"]\n\n${all.map(t=>`ref table ${t}`).join('\n')}\n`);
  const folder=dataDir.endsWith('\\')||dataDir.endsWith('/')?dataDir:dataDir+'\\';
  const web=variant==='start';
  writeFileSync(def+'expressions.tmdl',
`/// Lokale map met de bronbestanden (terugval zonder internet). npm run prepare:powerbi zet dit pad.
expression DataFolder = "${folder.replaceAll('"','""')}" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]

/// Workshopsite voor de BI-CSV's. Leeg = lokale kopie in DataFolder.
expression BaseUrl = "${web?HOST+'data/':''}" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=false]

/// Workshopsite voor de AI-output. Leeg = lokale kopie in DataFolder.
expression AiBaseUrl = "${web?HOST:''}" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=false]

expression LeesBron =
\t\t(Bestand as text) as binary =>
\t\t    if Text.Trim(BaseUrl) <> "" then Web.Contents(BaseUrl, [RelativePath = Bestand]) else File.Contents(DataFolder & Bestand)

expression LeesAI =
\t\t(Naam as text) as list =>
\t\t    Json.Document(if Text.Trim(AiBaseUrl) <> "" then Web.Contents(AiBaseUrl, [RelativePath = "api/" & Naam]) else File.Contents(DataFolder & "ai-" & Naam & ".json"))
`);
  // Oude cache hoort bij het vorige model; Desktop bouwt hem opnieuw op.
  rmSync(fileURLToPath(new URL(`../powerbi/${variant}/Donderdam.SemanticModel/.pbi/cache.abf`,import.meta.url)),{force:true});
}
console.log(`Model geschreven: ${tables.length} tabellen, ${rel.length} relaties${withAI?`, ${aiTables.length} AI-tabellen`:', nog zonder AI-tabellen'}.`);
