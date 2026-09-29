import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
mkdirSync(new URL('../powerquery/',import.meta.url),{recursive:true});
for(const [table,flavor] of [['AI_Inzichten','insights'],['AI_Verdieping','deep-dives'],['AI_Aanbevelingen','recommendations']]) {
  const rows=JSON.parse(readFileSync(new URL(`../data/ai-${flavor}.json`,import.meta.url),'utf8'));
  const types=Object.keys(rows[0]).map(k=>`{"${k}", ${k==='Peilmaand'?'type date':['KPI_ID','Volgorde','Focus_Wijk_ID'].includes(k)?'Int64.Type':['Waarde','Target','Waarde_VJ','Wijk_Waarde','Wijk_Target','Wijk_Waarde_VJ'].includes(k)?'type number':'type text'}}`).join(', ');
  for(const local of [false,true]) {
    const source=local?`Json.Document(File.Contents(DataFolder & "ai-${flavor}.json"))`:`Json.Document(Web.Contents("https://donderdam.brusseedesign.nl/", [RelativePath = "api/${flavor}"]))`;
    const m=`// Querynaam: ${table}. ${local?'Gebruikt de bestaande DataFolder-parameter.':'Leest de workshop-API. Zonder internet: gebruik de -lokaal-variant.'}\nlet\n    Bron = ${source},\n    Tabel = Table.FromRecords(Bron),\n    Typen = Table.TransformColumnTypes(Tabel, {${types}}, "en-US")\nin\n    Typen\n`;
    writeFileSync(new URL(`../powerquery/${table}${local?'-lokaal':''}.m`,import.meta.url),m);
  }
}
console.log('Zes complete Power Query-snippets geschreven.');
