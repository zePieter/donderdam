# Klaarzetten · organisator

## Vanavond of morgenvroeg (10 minuten)

1. `https://donderdam.brusseedesign.nl/api/status` toont `ai_maanden: 2026-06, 2026-07, 2026-08` en `ai_ready: true`.
2. Open `powerbi/voorbeeld/Donderdam.pbip` → **Refresh** → Werkplaats, Nieuwe woningen, aug 2026: 91 (oranje), doel 107, Zuidrand en De Havenmeent oranje.
3. Open `powerbi/start/Donderdam.pbip` → **Refresh** (kies **Anonymous** als erom gevraagd wordt): 91 / 107, AI-zone leeg.
4. Zet `uitdelen/Donderdam-start.zip` (map erboven) en `docs/02-groepsopdrachten.md` in Teams. Het spiekbriefje (`docs/04`) houd je achter de hand.
5. Laptop met Power BI Desktop, Node en deze repository mee voor de demo. Deelnemers hebben alleen Power BI Desktop en de zip nodig.

## Hoe de onderdelen samenhangen

```text
data/basis (fictief)  → npm run build:data  → data/*.csv (stermodel, domeinfeiten)
data/*.csv            → npm run generate    → Gemini → controle → data/ai-output.json + data/runs/
                      → npm run build:powerbi → TMDL voor start en voorbeeld
git push → Hostinger bouwt → donderdam.brusseedesign.nl (API + /data + /runs)
```

- **start** leest BI én AI van de website. Leeg je de parameters BaseUrl en AiBaseUrl (Transform data → Edit parameters), dan leest hij lokaal uit DataFolder.
- **voorbeeld** leest lokaal, zodat een live generatie direct na Refresh zichtbaar is.

## Live generatie in de demo

```powershell
npm run generate -- 2026-09
```

Dit is één echte Gemini-aanroep (gratis tarief, ±10 seconden). Daarna: in het voorbeeld **Refresh** en sep 2026 kiezen. Voor de site: `git add -A`, `git commit -m "Run september"`, `git push`. Hostinger bouwt dan binnen ±1 minuut opnieuw. **Push niet terwijl groepen aan het werk zijn**: de site is een seconde of wat weg tijdens de herbouw.

## Terugval

| Probleem | Oplossing |
|---|---|
| Site onbereikbaar | Deelnemers: Edit parameters → BaseUrl en AiBaseUrl leeg, DataFolder = uitgepakte map `data\` uit de repo-zip |
| Gemini-limiet of netwerk bij de live stap | Laat een bestaande run zien op de site. Geen simulatie. |
| Desktop toont oude cijfers | Refresh; het bestand komt met een cache van 29 september |
