# Begeleiderskaart · draaiboek 60 minuten

| Tijd | Wat | Wie |
|---|---|---|
| 0–3 | Aanleiding: Donderdam was anderhalf jaar geleden een droomplaat (mockup). Vandaag: wat werkt er echt, en wat weten wij samen? | jij |
| 3–10 | **Demo van de keten** (hieronder) | jij |
| 10–13 | Groepjes, uitdagingen A/B/C verdelen, bestand openen, Refresh | allen |
| 13–43 | **Stoeien**: 30 minuten, begeleider loopt rond | groepen |
| 43–55 | Delen: 3 minuten per groep, rij invullen in de Waarmee/Hoe/Waarom-tabel | groepen |
| 55–60 | Oogst: do's en don'ts, "wat probeer ik deze maand bij een klant?" | allen |

Twee groepjes? Doe A en C: die liggen het verst uit elkaar. B gebruik je dan in de demo.

## Demo · 7 minuten · laat de bouwblokken herkennen

1. **Het BI-model** (Model view van het voorbeeld). Een stermodel met domeinfeiten: bevolking, woningoplevering per project, werkloosheid per leeftijdsgroep, vacatures per branche, CO₂ per sector, doelen. "Dit is wat je bij elke klant hebt."
2. **Wat het LLM ziet.** Open `donderdam.brusseedesign.nl` → klik een run aan → *2 · Wat het model zag*. "Per maand ±23.000 tekens: alle KPI's, alle wijken, projecten, branches. Geaggregeerd, geen personen."
3. **De instructie en het contract.** *1 · Instructie*: drie soorten output, elk met sleutels (KPI, wijk, maand) en een JSON-schema. "Dit is de stap van tekst naar data."
4. **De controle.** Elke sleutel moet bestaan, elk getal in de tekst moet in de data staan en elke hypothese moet op domeindata steunen. Anders krijgt het model zijn fout terug en één herkansing. Daarna stopt het.
5. **Het resultaat** (voorbeeld, pagina Werkplaats, Nieuwe woningen, aug 2026):
   - de kaart kleurt oranje door het AI-signaal ("5 maanden op rij", berekend, niet verzonnen);
   - Zuidrand en De Havenmeent kleuren oranje door de aanbeveling;
   - klik op Zuidrand: de wijkduiding noemt Zuidrand Oost van Van Rijn. Bevestig dat op **Onderbouwing**.
6. **Live** (optioneel, ±1 minuut). Laat het model ter plekke naar september kijken:
   ```powershell
   npm run generate -- 2026-09
   ```
   Klik daarna in het voorbeeld op **Refresh** en kies **sep 2026**: nieuwe output, nieuw tijdstip, nieuwe run op de site na `git push`. Lukt het niet (netwerk, limiet), dan laat je de runs van juni–augustus zien. Er is geen gesimuleerde vervanging.

Kernzin: *"De AI levert geen tekstvak maar data. Het interessante werk is waar die data aan hangt."*

## Tijdens het stoeien

| Signaal | Interventie |
|---|---|
| Na 8 minuten nog geen relatie | "Welke sleutels heeft deze tabel? Welke dimensies ken je al?" Spiekbriefje als het echt niet lukt. |
| Tekst verandert niet mee | Relatie ontbreekt of staat de verkeerde kant op; Peilmaand hoort aan Dim_Datum[Datum]. |
| Groep C zet de brug op tweerichtingen | Laten doen. Vraag dan: "Kies een andere KPI. Wat gebeurt er met je kaarten?" Dit is het beste leermoment. |
| Groep verdwaalt in opmaak | "Een Table met tekstterugloop is genoeg. Wat doet het voor de gebruiker?" |
| Iemand vindt een fout in de AI-tekst | Uitstekend. Bewaren voor het delen. |

## Wat de AI-output inhoudelijk doet · bekend uit de echte runs

**Sterk en onderbouwd (laat zien):**
- Woningbouw aug: "al vijf maanden op rij achter". Het getal is berekend en het model neemt het over.
- De aanbeveling in augustus legt zelf het verband dat **Van Rijn Bouwcombinatie** in twee wijken achterloopt (Zuidrand Oost en Havenkade). Dat patroon zit in de data. Controleer het op Onderbouwing.
- Donderdam West: 12,3% werkloosheid, stijgend in alle leeftijdsgroepen. Klopt met de grafiek.

**Klinkt overtuigend, maar is zwak (goed voor discussie):**
- Werkloosheid West: "sluitingen of reorganisaties bij werkgevers". Dat staat niet in de data. De data laat wel zien dat de vacatures in **Bouw & Techniek** met 16% dalen en dat de groep 27–49 jaar stijgt. In juni noemde het model dat verband nog, in augustus niet.
- CO₂ Binnenstede "door bouwlogistiek bij Marktkwartier": een gezocht verband tussen twee domeinen.
- De Havenmeent "minder inwoners door achterstand Havenkade": Havenkade telt maar 10 woningen.
- Signaal werkloosheid: "stijgt al 32 maanden ongunstig". Het model leest "32 maanden boven doel" als "32 maanden stijgend".

**Gemist:** de jeugdwerkloosheid in **Rietzoom** (15–26 jaar: 16,3% tegen 11,0% vorig jaar). Het staat in de data, maar geen enkele run noemt het. Vraag: "Wat zie jij dat de AI niet zag?"

**Slordigheden van een echt model:** "11.4 procent" (met een punt), "wegblyvende", "industrielsector". Die zijn niet gecorrigeerd: status *concept*.

Verander modeltekst nooit stilzwijgend. Voor een klant hoort er een review- en publicatiestap bij; die bouwen we vandaag niet.

## Afsluiting

- Welk bestaand dashboard bij een klant wordt hier beter van?
- Welke sleutel of context mist daar nog?
- Wat is de kleinste test die je deze maand kunt doen?
