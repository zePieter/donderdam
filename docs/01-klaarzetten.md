# Klaarzetten · organisator

## 1. Eén werkmap

Werk verder in deze repository: `workshop-v099/donderdam`. De oude bronmap en `bronkopie` zijn archief/bouwmateriaal. Gebruik die niet als nieuwe rapportversie.

Open deze map in VS Code. Open de Power BI-bestanden via onderstaande submappen, niet via een oudere vermelding bij Recent.

## 2. Workshopsite op Hostinger (eenmalig)

Voorwaarde: pakket **Business** of **Cloud** (alleen die ondersteunen Node.js-apps).

1. hPanel → **Websites** → **Add Website** → **Deploy Web App** → **Import Git Repository** → **Authorize** GitHub → kies `zePieter/donderdam`.
2. Framework **Other**, Node.js **24.x**, entry file `server.js`. Build command `npm run build`, start command `npm start` (als gevraagd). Output directory leeg laten of `.`. Geen environment variables: **geen Gemini-sleutel op de hosting**. `PORT` bepaalt Hostinger zelf.
3. **Deploy**. Koppel daarna het subdomein `donderdam.brusseedesign.nl` aan de app en wacht op SSL.
4. Controleer `https://donderdam.brusseedesign.nl/api/status`: verwacht `ai_contexts: 9`, `ai_ready: true`, `llm_calls_on_read: false`.

Hostinger bouwt opnieuw bij **elke push naar `main`**. Push dus niet tijdens de workshop.

## 3. Power BI openen

1. Sluit een al geopend Donderdam-rapport voordat je de projectbestanden wijzigt.
2. **Start** leest de BI-CSV's standaard van `https://donderdam.brusseedesign.nl/data/` (parameter BaseUrl). Deelnemers hoeven dus geen pad in te stellen.
3. **Voorbeeld** leest lokaal: voer op een andere computer `npm run prepare:powerbi` uit, of zet **Transform data → Edit parameters → DataFolder** op de map `data\`. **AiBaseUrl** leeg = lokale AI-snapshot; `https://donderdam.brusseedesign.nl/` = via de site.
4. Klik **Home → Refresh**. Kies bij de workshopsite **Anonymous** als Power BI om credentials vraagt. Vul nergens de Gemini-sleutel in.

## 4. Korte acceptatie

| Selectie | Werkelijk | Doel | Verschil vorig jaar |
|---|---:|---:|---:|
| Nieuwe woningen · augustus 2026 | 91 | 106,67 (kaart rondt af op 107) | −13,33% |
| Nieuwe woningen · juni 2026 | 70 | 80 | −13,58% |
| Werkloosheid · augustus 2026 | 8,21294% | 7% | +0,76234 procentpunt |
| CO2 · augustus 2026 | 1.849,5 ton YTD | 1.692,67 ton YTD | +0,69142% |

Controleer in het voorbeeld dat de AI-tekst verandert wanneer je juni/augustus of een andere gedekte KPI kiest. Bij inwoners of januari is er bewust geen AI-output. Selecties starten geen generatie.

## 5. Delen

Zip de map `powerbi/start` (zonder `.pbi`) en zet die met de groepsopdrachten in Teams. Houd de volledige repo-zip achter de hand als terugval zonder internet (zie begeleiderskaart). Het voorbeeld is jouw demo en terugvalpunt.

Opening (optioneel): toon `https://donderdam.brusseedesign.nl/api/insights?month=2026-08&kpi=WON` in de browser: “dit is AI-output als API, gefilterd op periode en KPI.”
