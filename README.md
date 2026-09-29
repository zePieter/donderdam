# Donderdam · AI toevoegen aan BI

Een workshop van 45 minuten: zelf echte AI-output inladen, modelleren en naast bestaande Power BI-visuals gebruiken. Twee of drie gemengde groepjes. Versie 0.99 in voorbereiding.

**Begin hier:** [klaarzetten](docs/01-klaarzetten.md) · [groepsopdrachten](docs/02-groepsopdrachten.md) · [begeleiderskaart](docs/03-begeleiderskaart.md) · [overdracht](docs/OVERDRACHT.md).

## Wat zit erin?

| Bestand/map | Gebruik |
|---|---|
| `powerbi/start/Donderdam.pbip` | BI-basis; deelnemers voegen zelf één AI-tabel toe. |
| `powerbi/voorbeeld/Donderdam.pbip` | Uitgewerkte verbinding met alle drie smaken. |
| `data/*.csv` | Bestaande fictieve BI-data: 33 maanden, 8 wijken, 7 KPI's. |
| `data/ai-output.json` | Negen echte Gemini API-responses, inclusief analysecontext en herkomst. |
| `data/ai-*.json` | Platte versies om rechtstreeks in Power BI te laden. |
| `powerquery/` | Plakbare queries voor online en lokaal inladen. |
| `prompts/` | Werkelijke prompt, JSON-schema en berekende context per peilmaand/KPI. |
| `lib/`, `scripts/`, `server.js` | Kleine Node.js-app, zonder externe packages. |

**De BI-data is gesimuleerd; de AI-tekst is werkelijk door Gemini gegenereerd.** Een opgeslagen LLM-response blijft echte modeloutput. De tekst is een concept dat je aan de cijfers toetst, geen geverifieerde oorzaak of beleidsadvies.

## Codebase en lokaal starten

Node.js 22 of 24, gewone JavaScript-modules, ingebouwde HTTP-server, JSON/CSV. Geen database, frontendframework, betaald platform of LLM-aanroep vanaf de website nodig.

Open deze repositorymap in VS Code → Terminal → New Terminal:

```powershell
npm test
npm run build
npm start
```

Open `http://localhost:3000/`. `/api/status` hoort 9 AI-contexten te melden. De website kan volledig zonder `.env` of Gemini-sleutel draaien.

Op een andere computer: `npm run prepare:powerbi` zet de lokale datapaden; zonder Node kan dit via Power BI → Transform data → Edit parameters → DataFolder.

## De datalaag

```text
Fictieve CSV-feiten → berekende maand/KPI-context → Gemini (eenmalige batch)
       ↓                                      ↓
Power BI-feiten                     opgeslagen AI-JSON
       └──── gedeelde Datum- en KPI-dimensies ──┘
                  ↓
       Gewone kaarten, tabellen en grafieken
```

AI-dekking: WON, WLH en CO2 × juni, juli en augustus 2026. Scope: de gemeente. `Focus_Wijk_ID` is een genoemde wijk binnen die analyse; het is **geen wijkfilter voor de hele analyse**. Daarom koppelen de AI-tabellen alleen aan datum en KPI.

Selecties lezen de ingeladen analyses. Refresh leest een nieuw bestand of de API opnieuw. Alleen `npm run generate` doet LLM-aanroepen.

## Nieuwe AI-output genereren (alleen organisator)

Kopieer `.env.example` naar `.env`, vul lokaal de sleutel in en bevestig `Free` nadat je het project in AI Studio hebt gecontroleerd. Geen billing activeren voor deze workshop. `.env` en `runs/` blijven buiten Git.

```powershell
npm run generate -- --all
npm run snapshots
npm run build
```

Bestaande contexten met dezelfde bron worden overgeslagen. `--force` genereert bewust opnieuw. Bij een limietfout stopt de batch; er is geen betaalde uitwijk of gesimuleerde vervanging. Ruwe responses staan lokaal in `runs/`; per opgeslagen context staan model, tijdstip, request-id, prompt- en responsehash. Alleen fictieve geaggregeerde data gaat naar Gemini.

## Hostinger

Koppel de GitHub-repository als Node.js-app. Instellingen: Node 24 (of 22), framework **Other**, projectroot `.`, build `npm run build`, start `npm start` of entrypoint `server.js`. Laat Hostinger `PORT` bepalen. **Geen Gemini-key instellen op de hosting**: de app serveert opgeslagen output. Koppel daarna `donderdam.brusseedesign.nl` en controleer HTTPS en `/api/status`.

Deze repository is lokaal verbonden met `https://github.com/zePieter/donderdam`. Online bereikbaarheid is pas aangetoond na een geslaagde deploymenttest; zie overdracht voor de actuele status.

Technische referenties: [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output), [gratis modelplan en tarieven](https://ai.google.dev/gemini-api/docs/pricing), [Hostinger Node.js](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).
