import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {sep} from 'node:path';
const data=fileURLToPath(new URL('../data/',import.meta.url)).replaceAll('"','""');
for(const variant of ['start','voorbeeld']) {
  const file=new URL(`../powerbi/${variant}/Donderdam.SemanticModel/definition/expressions.tmdl`,import.meta.url);
  let text=readFileSync(file,'utf8');
  text=text.replace(/expression DataFolder = ".*?" meta/,`expression DataFolder = "${data.endsWith(sep)?data:data+sep}" meta`);
  writeFileSync(file,text);
}
console.log('Beide Power BI-projecten verwijzen nu naar de data-map op deze computer.');
