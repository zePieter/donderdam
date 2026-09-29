# Donderdam · AI toevoegen aan BI

Workshop voor BI-collega's: een taalmodel heeft de Donderdam-data bekeken, de output staat als tabellen in het model. Groepen bepalen waar die AI-output aan hangt en verrijken een bestaand dashboard. Versie 1.0.

**Begin hier:** [klaarzetten](docs/01-klaarzetten.md) · [uitdagingen](docs/02-groepsopdrachten.md) · [begeleiderskaart](docs/03-begeleiderskaart.md) · [spiekbriefje](docs/04-spiekbriefje.md) · [overdracht](docs/OVERDRACHT.md).

| Bestand/map | Gebruik |
|---|---|
| `powerbi/start/` | Klassiek dashboard + 4 AI-tabellen, nog los. Dit krijgen de groepen. |
| `powerbi/voorbeeld/` | Uitgewerkt: drie infusements op klassieke visuals. |
| `data/*.csv` | Fictief stermodel: 7 dimensies, 6 domeinfeiten (bron: `data/basis`). |
| `data/ai-output.json`, `data/runs/` | Echte Gemini-runs met prompt, context en antwoord. |
| `lib/`, `scripts/`, `server.js` | Node-app zonder externe packages. |

**De BI-data is fictief; de AI-tekst is echte modeloutput (status concept).**

## Codebase en lokaal starten

Node.js 22 of 24, gewone JavaScript-modules, ingebouwde HTTP-server, JSON/CSV. Geen database, frontendframework, betaald platform of LLM-aanroep vanaf de website nodig.

Open deze repositorymap in VS Code → Terminal → New Terminal:

```powershell
npm test
npm run build
npm start
```

Open `http://localhost:3000/`. De site toont de runs; `/api/status` meldt de beschikbare AI-maanden.

De startversie leest de BI-data van de workshopsite. Het voorbeeld leest lokaal: `npm run prepare:powerbi` zet de datapaden; zonder Node kan dit via Power BI → Transform data → Edit parameters → DataFolder.

## Nieuwe AI-output genereren (alleen organisator)

Kopieer `.env.example` naar `.env`, vul lokaal de sleutel in en bevestig `Free` nadat je het project in AI Studio hebt gecontroleerd. Geen billing activeren voor deze workshop. `.env` en `runs/` blijven buiten Git.

```powershell
npm run generate -- --all      # of: npm run generate -- 2026-09
npm run build:powerbi
npm run build
```

Bestaande maanden met dezelfde brondata worden overgeslagen; `--force` genereert opnieuw. Per maand één aanroep; een afgekeurde respons krijgt één herkansing met de foutmelding. Alleen fictieve geaggregeerde data gaat naar Gemini. Runs staan in `data/runs/` en zijn op de site te bekijken.

## Hostinger

Stappen in hPanel: zie [klaarzetten §2](docs/01-klaarzetten.md). Kort: Node.js-app uit GitHub (`zePieter/donderdam`), framework **Other**, Node 24, entry `server.js`, build `npm run build`, start `npm start`. Hostinger bepaalt `PORT`. **Geen Gemini-key op de hosting**: de app serveert opgeslagen output. Subdomein `donderdam.brusseedesign.nl`; de Power Query-snippets en de startversie verwijzen daarheen.

Hostinger bouwt opnieuw bij elke push naar `main`. Online bereikbaarheid is pas aangetoond na een geslaagde deploymenttest; zie overdracht.

Technische referenties: [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output), [gratis modelplan en tarieven](https://ai.google.dev/gemini-api/docs/pricing), [Hostinger Node.js](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).
