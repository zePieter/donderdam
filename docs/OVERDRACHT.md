# Overdracht · stand 29 september 2026

Voortgezet in Claude Code na de ChatGPT Work-sessie (inventarisatie en bouw 11:10–12:01). Lees daarna [klaarzetten](01-klaarzetten.md) en [groepsopdrachten](02-groepsopdrachten.md).

## Gekozen route

AI-output en BI-CSV's via de eigen workshopsite **`https://donderdam.brusseedesign.nl`** (Node-app op Hostinger, gekoppeld aan GitHub `zePieter/donderdam`). Deelnemers: zip uitpakken, Refresh, Anonymous, één URL plakken, relaties leggen, Table maken. Terugval zonder internet: lokale `data/` + `-lokaal.m`.

## Getest en werkend

| Wat | Hoe getest | Resultaat |
|---|---|---|
| Node-app en data | `npm test`, `npm run build` | 9/9 tests, 9 echte Gemini-contexten |
| Voorbeeld-PBIP in Desktop 2.157 | Openen, volledige refresh, DAX-query (`../controle/test-desktop.ps1`) | 9/9 contexten: juiste waarde/doel/VJ en precies één AI-rij |
| Voorbeeld visueel | Schermafdruk Werkplaats + Drie AI-smaken | Leesbaar, thema actief, tekst loopt terug |
| Start-PBIP in Desktop | Openen, volledige refresh, schermafdruk Werkplaats + Trends | BI-cijfers kloppen (WON aug: 91 / 107 / −13,3%); AI-plek is instructievlak |
| Deelnemerspad lokaal | Kopie van start + `AI_Inzichten-lokaal.m` + twee relaties, refresh, DAX | 9 rijen; elke context één rij met juiste titel; INW en januari nul rijen |
| Live site (29-09, 13:35) | Alle endpoints op `https://donderdam.brusseedesign.nl` | `/api/status` 9/9 `ai_ready`; insights/deep-dives 9, recommendations 27 (gefilterd 3); `/data/fact_kpi.csv` 1.848; foute maand 400; `/.env` 403 |
| Deelnemerspad tegen live site | Kopie van start + web-snippets, DataFolder bewust ongeldig, Desktop-refresh | Eerst venster **Access Web content → Anonymous → Connect** (zoals in opdracht). Daarna BI 1.848 rijen, AI 9 rijen, filter aug/WON 3 adviezen, WON aug 91, INW 0 AI-rijen |

Refresh zonder klikken: open het PBIP en draai `../controle/refresh-desktop.ps1`.

## Veranderd sinds ChatGPT

- **AI-tekst was onleesbaar.** Desktop negeerde de lettergrootte van de tekst-Cards: reuzeletter, afgekapt. Die Cards zijn nu gewone **Tables** met tekstterugloop, hetzelfde patroon dat de groepen bouwen. Script: `../herstel_tekstvlakken.mjs`.
- **Donderdam-thema** geregistreerd in beide rapporten. Grafieken: legenda Werkelijk/Doel, doel in zandkleur, geen technische astitels; slicers herhalen de veldnaam niet.
- **Verdieping:** Gemini zette `missing_data` soms nog eens achter de hypothese. De platte tabel laat die herhaling weg; ruwe responses (`ai-output.json`, `runs/`) zijn **niet** gewijzigd. Measure toont "Focus: wijk".
- **Hostinger-klaar:** `npm start` = `node server.js` (geen `.env`-vlag die oudere Node mist). Snippets en de startversie wijzen naar `donderdam.brusseedesign.nl`. Groepsopdrachten met vaste URL's en een bonus over API-parameters.
- Eerste commit en push naar GitHub gedaan.

## Nog open

1. **Hostinger:** gekoppeld en live sinds 29-09 13:35 (deploy uit `main`). Eerste deploy gaf 503: `server.js` luisterde alleen bij directe start; opgelost in `1fffb4c` (logica in `lib/api.js`).
2. **UI-route met de muis:** Get data → Web → To Table → uitvouwen is niet handmatig doorgeklikt (de query zelf is bewezen). Eén keer naspelen na livegang.
3. **Inhoud:** insight-teksten zijn vlak ("boven doel, hoger dan vorig jaar"). Bruikbaar als discussiepunt (opdracht 1). Bekende foute claim CO2 jul/aug "als enige": zie begeleiderskaart.
4. Op poort 3000 draaide nog een oudere lokale server (gestart vóór deze wijzigingen). Stop die of herstart met `npm start` voor een demo.

## Niet doen

Geen Gemini-sleutel op hosting, in Power Query of in Git. `.env`, `runs/` en `.pbi/` blijven buiten Git. Niet pushen tijdens de workshop.
