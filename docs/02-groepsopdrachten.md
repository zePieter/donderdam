# Groepsopdrachten · 45 minuten

**Doel:** voeg een bruikbare AI-laag toe aan het bestaande Donderdam-dashboard. Jullie laden zelf de output, kiezen de juiste relaties en tonen de informatie naast de cijfers. Echte Gemini-tekst, fictieve gemeentecijfers.

Maak twee of drie gemengde groepjes. Verdeel binnen het groepje: iemand bedient Power BI, iemand controleert de cijfers en iemand bewaakt de gebruikersvraag. Wissel na tien minuten.

| Minuten | Samen doen |
|---|---|
| 0–5 | Korte demo: bestaande BI + één extra AI-tabel. Kies een smaak. |
| 5–12 | JSON inladen en kolomtypen controleren. |
| 12–20 | Relaties leggen en eerste visual maken. |
| 20–32 | Periode/KPI wisselen, inhoud toetsen en visual bruikbaar maken. |
| 32–41 | Ieder groepje demonstreert in circa drie minuten. |
| 41–45 | Kies één toepassing in een eigen klantdashboard en benoem de eerstvolgende kleine stap. |

## Voor alle groepjes · aansluiten

1. Open jullie kopie van `powerbi/start/Donderdam.pbip`. De organisator heeft de BI-bron voorbereid. Kies **Nieuwe woningen** en **aug 2026**; verwacht **91**, doel **107**.
2. Kies **Home → Get data → Web** en plak de bron-URL van jullie smaak hieronder. Kies bij deze openbare workshopbron **Anonymous**. Klik **Transform data**.
3. Zien jullie een lijst? Kies **To Table**, bevestig en klik de dubbele pijl in de kolomkop om alle recordvelden uit te vouwen. Haal het vinkje bij kolomnaam als prefix weg. Als Desktop al een tabel toont, is dit niet nodig.
4. Hernoem de query volgens de tabel hieronder. Zet **Peilmaand** op **Date**, **KPI_ID** op **Whole number** en tekstvelden op **Text**. Gebruik **Close & Apply**.
5. Ga naar **Model view → Manage relationships → New**. Leg twee actieve relaties: jullie tabel `[KPI_ID]` → `Dim_KPI[KPI_ID]`, en `[Peilmaand]` → `Dim_Datum[Datum]`. Beide **Many to one (*:1)** en **Single**. De dimensies filteren de AI-tabel. Controleer of Desktop geen ongewenste automatische relaties heeft toegevoegd.
6. Maak jullie visual. Gebruik de bestaande KPI- en maandslicer. Kies alleen juni, juli of augustus 2026 en WON, WLH of CO2 voor AI.

**Snelle hulp:** plak de volledige query uit `powerquery/` in **Transform data → New source → Blank query → Advanced Editor**. Pas alleen de basis-URL aan. Zonder hosting kies je de bijbehorende `-lokaal.m` met de bestaande DataFolder-parameter. De relaties blijven jullie eigen stap.

| Smaak | Naam query | Pad achter de gedeelde URL | Lokale bron |
|---|---|---|---|
| 1 · Inzicht | AI_Inzichten | `/api/insights` | `data/ai-insights.json` |
| 2 · Verdieping | AI_Verdieping | `/api/deep-dives` | `data/ai-deep-dives.json` |
| 3 · Aanbevelingen | AI_Aanbevelingen | `/api/recommendations` | `data/ai-recommendations.json` |

## 1 · Inzicht: wat voegt de tekst toe?

**Gebruikersvraag:** “Wat moet ik bij deze KPI als eerste zien?”

Maak een gewone **Table** met `Titel`, `Inzicht` en `Review_Status`. Zet **Values → Text wrap** aan en **Totals** uit. Maak het vlak naast de bestaande wijkgrafiek leesbaar; liever minder velden dan piepkleine tekst. Voeg eventueel een kleine tabel met `Model` en `Peilmaand` toe.

Test augustus tegenover juni, daarna woningbouw tegenover werkloosheid. Controleer één bewering met de kaart en één met **Trends**. Leg uit of de tekst méér zegt dan “rood is slecht”.

**Klaar als:** de juiste tekst met beide slicers meeverandert, inwoners geen AI-rij oplevert en jullie één nuttige duiding én één beperking kunnen noemen.

## 2 · Verdieping: waar kijk ik verder?

**Gebruikersvraag:** “Welke wijk verdient nader onderzoek, en wat weten we nog niet?”

Maak een gewone **Table** met `Focus_Wijk`, `Observatie`, `Hypothese` en `Ontbrekende_Data`; tekstterugloop aan, totalen uit. Controleer de genoemde wijk op **Trends** met de wijkselectie.

`Focus_Wijk_ID` is de wijk die de AI aanwijst binnen een gemeentebrede analyse. Leg **geen actieve relatie van dat veld naar Dim_Wijk**: daarmee wordt een genoemd voorbeeld ten onrechte de scope van de hele analyse. De AI kent geen vergunningen, werkgevers of bouwprojecten.

Test een andere peilmaand. Maak voor de gebruiker zichtbaar wat observatie is en wat alleen een mogelijke verklaring is. Benoem de data waarmee je die verklaring zou toetsen.

**Klaar als:** periode en KPI goed filteren, jullie de opvallende wijk in BI hebben gecontroleerd en niemand een hypothese voor een bewezen oorzaak kan aanzien.

## 3 · Aanbevelingen: welke vervolgstap helpt?

**Gebruikersvraag:** “Wat kan ik verstandig als volgende stap onderzoeken?”

Maak een gewone **Table** met `Volgorde`, `Titel`, `Suggestie` en `Te_Toetsen`; sorteer op Volgorde, tekstterugloop aan, totalen uit. Eén periode/KPI heeft drie voorstellen. Kies met het groepje de bruikbaarste en wijs een generiek of ongefundeerd voorstel af.

Als dit staat: voeg een gewone **Slicer** met `AI_Aanbevelingen[Volgorde]` toe, enkelvoudige selectie, stijl **Tile**. Daarmee kiest de gebruiker een al gegenereerd alternatief. Dit is een interactie met AI-data; de knop roept geen LLM aan.

**Klaar als:** de drie voorstellen bij de juiste context verschijnen, een alternatief selecteerbaar is en jullie kunnen uitleggen welke toets nodig is vóór uitvoering. Bouw geen actieketen.

## Bespreek met de andere groepjes

Laat één werkende selectie zien, benoem wat de gebruiker ermee wint en toon één punt waarop je de AI moet begrenzen. Bij twee groepjes doet groep 2 eerst verdieping en voegt alleen bij voldoende tijd de aanbevelingentabel toe.
