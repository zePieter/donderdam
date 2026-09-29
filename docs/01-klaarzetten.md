# Klaarzetten · organisator

## 1. Eén werkmap

Werk verder in deze repository: `workshop-v099/donderdam`. De oude bronmap en `bronkopie` zijn archief/bouwmateriaal. Gebruik die niet als nieuwe rapportversie.

Open deze map in VS Code. Open de Power BI-bestanden via onderstaande submappen, niet via een oudere vermelding bij Recent.

## 2. Bron beschikbaar maken

Voor deelnemers bij voorkeur de gedeelde HTTPS-URL. Als hosting nog ontbreekt: gebruik de meegeleverde JSON-bestanden. Die bevatten dezelfde echte modeloutput. Deelnemers hebben geen AI-account of sleutel nodig.

Lokaal de webbron testen: VS Code → Terminal → New Terminal → `npm start`. Laat die terminal draaien. Open `http://localhost:3000/api/status`; verwacht `ai_contexts: 9`, `ai_ready: true` en `llm_calls_on_read: false`.

`localhost` betekent ieders eigen computer. Geef deelnemers dus de gedeelde URL of de lokale bestanden; de localhost-URL op jouw laptop is niet hun webbron.

## 3. Power BI openen

1. Sluit een al geopend Donderdam-rapport voordat je de projectbestanden wijzigt.
2. Op een andere computer: voer in de repository `npm run prepare:powerbi` uit. Geen Node? Open het PBIP en kies **Transform data → Edit parameters**. Zet **DataFolder** op het volledige pad naar de map `data`, inclusief afsluitende `\`.
3. Open `powerbi/start/Donderdam.pbip` voor de deelnemers of `powerbi/voorbeeld/Donderdam.pbip` voor de demonstratie.
4. Klik **Home → Refresh**. Dit laadt de brondata. Bij het voorbeeld staat **AiBaseUrl** aanvankelijk leeg: dat gebruikt de echte lokale AI-snapshot.
5. Voor webgebruik in het voorbeeld: **AiBaseUrl** wordt `http://localhost:3000/` of de gedeelde HTTPS-root, met afsluitende `/`. Kies bij de openbare workshopbron **Anonymous** als Power BI om credentials vraagt. Vul nergens de Gemini-sleutel in.
6. Laat **BaseUrl** leeg voor lokale BI-CSV's. Alleen als je ook de BI-bron via de website wilt lezen: zet BaseUrl op de URL eindigend op `/data/`.

## 4. Korte acceptatie

| Selectie | Werkelijk | Doel | Verschil vorig jaar |
|---|---:|---:|---:|
| Nieuwe woningen · augustus 2026 | 91 | 106,67 (kaart rondt af op 107) | −13,33% |
| Nieuwe woningen · juni 2026 | 70 | 80 | −13,58% |
| Werkloosheid · augustus 2026 | 8,21294% | 7% | +0,76234 procentpunt |
| CO2 · augustus 2026 | 1.849,5 ton YTD | 1.692,67 ton YTD | +0,69142% |

Controleer in het voorbeeld dat de AI-tekst verandert wanneer je juni/augustus of een andere gedekte KPI kiest. Bij inwoners of januari is er bewust geen AI-output. Selecties starten geen generatie.

## 5. Delen en doorgaan

Geef elk groepje een eigen kopie van de **start**-map, de **data**-map, hun opdracht en de Power Query-snippet. Het voorbeeld houd je als terugvalpunt. In VS Code Source Control horen `.env`, `runs/` en `.pbi` niet bij de wijzigingen. Een lokale commit is nog geen GitHub-push; een push is nog geen Hostinger-deployment.
