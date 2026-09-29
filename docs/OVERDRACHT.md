# Overdracht · stand 29 september 2026, 12:25

Voortgezet in Claude Code na de ChatGPT Work-sessie (inventarisatie en bouw 11:10–12:01). Lees daarna [klaarzetten](01-klaarzetten.md) en [groepsopdrachten](02-groepsopdrachten.md).

## Getest en werkend

| Wat | Hoe getest | Resultaat |
|---|---|---|
| Node-app en data | `npm test`, `npm run build` | 9/9 tests, 9 echte Gemini-contexten |
| Voorbeeld-PBIP in Desktop 2.157 | Openen, volledige refresh, DAX-query (`../controle/test-desktop.ps1`) | 9/9 contexten: juiste waarde/doel/VJ en precies één AI-rij |
| Voorbeeld visueel | Schermafdruk Werkplaats + Drie AI-smaken | Leesbaar, thema actief, tekst loopt terug |
| Start-PBIP in Desktop | Openen, volledige refresh, schermafdruk Werkplaats + Trends | BI-cijfers kloppen (WON aug: 91 / 107 / −13,3%); AI-plek is instructievlak |
| Deelnemerspad (lokaal) | Kopie van start + `powerquery/AI_Inzichten-lokaal.m` + de twee relaties uit opdracht stap 5, refresh, DAX | 9 rijen, Peilmaand als datum; 9 contexten precies één rij met juiste titel; INW en januari nul rijen |

Refresh zonder klikken: open het PBIP en draai `../controle/refresh-desktop.ps1` (verbindt met het lokale model van Desktop).

## Veranderd sinds ChatGPT

- **AI-tekst was onleesbaar.** Desktop negeerde de lettergrootte van de tekst-Cards: reuzeletter, afgekapt. Die Cards zijn nu gewone **Tables** met tekstterugloop. Dat is ook het patroon dat de groepen zelf bouwen. Het script is `../herstel_tekstvlakken.mjs` en kan opnieuw worden gedraaid.
- **Donderdam-thema** geregistreerd in beide rapporten (was alleen het basisthema, met blauwe balken).
- Wijk- en trendgrafiek: legenda Werkelijk/Doel, doel in zandkleur in plaats van alarmoranje, geen technische astitels. Slicers herhalen de veldnaam niet meer.
- **Verdieping:** Gemini zette `missing_data` soms nog eens achter de hypothese. De platte tabel (`/api/deep-dives`, `ai-deep-dives.json`) laat die herhaling weg. Ruwe responses in `ai-output.json` en `runs/` zijn **niet** gewijzigd. Measure toont nu "Focus: wijk".
- Beide PBIP's zijn door Desktop zelf opgeslagen na de refresh; lokale cache is actueel.

## Nog open

1. **Hosting.** Er is nog geen publieke URL. Zonder URL werkt de workshop volledig met de lokale `-lokaal.m`-queries en `data/ai-*.json`.
2. **Git.** De repository heeft nog geen commit; niets staat op GitHub (`zePieter/donderdam`).
3. **Deelnemerspad niet met de muis doorgeklikt.** De plakquery + relaties zijn in Desktop bewezen (tabel hierboven). Niet getest: de UI-route **Get data → Web** (lijst → To Table → uitvouwen), want die vraagt een URL. Speel die één keer zelf na (±10 min) zodra er hosting is, of met `npm start` en `http://localhost:3000/api/insights`.
4. **Inhoud.** De insight-teksten zijn vlak ("boven doel, hoger dan vorig jaar"). Dat is bruikbaar als discussiepunt (zie opdracht 1). Opnieuw genereren met een scherpere prompt kan, maar is bewust niet gedaan. Bekende foute claim CO2 jul/aug "als enige": zie begeleiderskaart.

## Niet doen

Geen Gemini-sleutel op hosting, in Power Query of in Git. `.env`, `runs/` en `.pbi/` blijven buiten Git (staat in `.gitignore`).
