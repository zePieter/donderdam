const key=process.env.GEMINI_API_KEY;
if(!key)throw new Error('Sleutel ontbreekt');
const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models',{headers:{'x-goog-api-key':key}});
const body=await r.json();
console.log('HTTP',r.status);
if(!r.ok)console.log(String(body.error?.message??'Geen omschrijving').split(key).join('[verwijderd]').slice(0,600));
else console.log(body.models.filter(m=>/flash/.test(m.name)&&m.supportedGenerationMethods?.includes('generateContent')).map(m=>({name:m.name,displayName:m.displayName})));
