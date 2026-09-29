# Donderdam · werkafspraken voor voortzetting

Lees eerst README.md, docs/OVERDRACHT.md en docs/03-begeleiderskaart.md.

- **Kern:** de AI-output staat al als data (met sleutels) in het model. Deelnemers bepalen Waarmee/Hoe/Waarom: waar hangt het aan, welke measure, welke bestaande visual. Geen DAX-cursus, geen opmaakwedstrijd, geen klikrecepten.
- **Vorm:** 60 minuten, 30 minuten netto stoeien, 2–3 gemengde groepjes, één uitdaging per groep (A signaal, B wijkduiding, C aanbeveling). Spiekbriefje alleen als vangnet.
- **Model:** zuiver stermodel met domeinfeiten volgens de standaarden; geen generieke Fact_KPI. Measures in `_Meetwaarden`, relaties 1:* in één richting. Model wordt gegenereerd door `scripts/build-powerbi.js`; niet met de hand in TMDL werken.
- **LLM:** echte Gemini-runs (gratis tarief bevestigd), per peilmaand één aanroep met alle domeindata. Getallen in de tekst moeten in de data staan, en een hypothese moet op domeindata steunen. Eén herkansing, daarna stoppen. Geen simulatie, geen betaalde uitwijk, geen sleutel in Git, op de hosting of in Power BI.
- **Site:** leest alleen, roept het LLM nooit aan. Hostinger bouwt opnieuw bij elke push naar main.
- **Test:** echte Desktop-lading plus een schermafdruk. Een DAX-query bewijst het model, niet de visual. Card-visuals negeren de lettergrootte bij lange tekst; gebruik een Table met tekstterugloop. Kleur via een measure werkt niet bij meerdere measures in één grafiek.
- **Communicatie met de organisator:** per keuze expliciet voor- en nadelen met het gevolg. Kort; details in docs.
