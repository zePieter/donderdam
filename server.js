// Startbestand. Luistert altijd, ook als een hostingstarter (Hostinger/LiteSpeed) dit bestand laadt
// in plaats van `node server.js`. PORT kan een poortnummer of een socketpad zijn.
import {createServer} from './lib/api.js';

const raw=process.env.PORT??'3000';
const port=/^\d+$/.test(raw)?Number(raw):raw;
createServer().listen(port,()=>console.log(`Donderdam luistert op ${port}. GET-verzoeken roepen geen LLM aan.`));
