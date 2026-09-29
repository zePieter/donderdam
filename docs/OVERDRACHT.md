# Overdracht · stand 29 september 2026, middag

Versie 1.0. De vangnetversie van vanochtend staat onder git-tag `v0.99-vangnet`.

## Wat er veranderd is en waarom

De eerste opzet (v0.99) liet deelnemers kant-en-klare AI-tekst naast een KPI zetten, met klikinstructies. Dat raakte de kern niet. De nieuwe kern: **de AI-output staat al als data in het model; de groepen bepalen waar hij aan hangt (Waarmee/Hoe/Waarom).**

| Onderdeel | v0.99 | v1.0 |
|---|---|---|
| BI-model | Eén generieke Fact_KPI | Stermodel met 6 domeinfeiten, eigen grain, gedeelde dimensies |
| Wat het LLM zag | Eén KPI per aanroep | Per maand alles: 4 KPI's × 8 wijken, projecten, leeftijdsgroepen, branches, sectoren |
| AI-output | Tekst op gemeenteniveau | 3 infusements met sleutels: signaal (KPI × maand), wijkduiding (wijk × KPI × maand), aanbeveling + brug naar wijken |
| Controle | Geen getallen toegestaan | Getallen toegestaan maar gecontroleerd tegen de data; hypothese moet op domeindata steunen |
| Deelnemers | Get data + klikstappen | Kant-en-klaar bestand; uitdaging per groep; spiekbriefje als vangnet |
| Zichtbaarheid LLM | Alleen modelnaam | Per run de prompt, de data en het antwoord op de site; live generatie in de demo |

## Getest (29-09, Power BI Desktop 2.157)

| Wat | Resultaat |
|---|---|
| `npm test` / `npm run build` | 9/9; 3 echte runs door de controle |
| Controlecijfers nieuw model | Gelijk aan v0.99: WON aug 91 / 106,67 / 105; WLH 8,21% / 7%; CO₂ 1.849,5; INW 41.818 |
| Voorbeeld in Desktop | Alle drie infusements zichtbaar en werkend (schermafdruk) |
| Start in Desktop tegen live site | BI 384 opleverrijen, AI 12 / 15 / 9 / 15 rijen, zonder relaties (bedoeld) |
| Live site | `/api/status` schema 2.0, runs zichtbaar |

**Niet getest:** een groep die een uitdaging echt met de muis doorloopt, en de interactie "klik op een aanbeveling → wijken markeren" via klikken (de measure is met DAX bewezen, de kleur met een schermafdruk). Speel uitdaging C vanavond één keer na.

## Bouwscripts

- In de repo: `scripts/build-domain.js` (data), `scripts/generate.js` (LLM), `scripts/build-powerbi.js` (TMDL).
- Rapportpagina's (map erboven): `bouw_onderbouwing.mjs`, daarna `bouw_werkplaats.mjs`. Sluit Desktop vóór het draaien.
- Desktop-test: `controle/refresh-desktop.ps1` en `controle/dax.ps1 -Query "EVALUATE ..."`.
